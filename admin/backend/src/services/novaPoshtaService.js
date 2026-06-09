const axios = require('axios');

const NP_API_URL = 'https://api.novaposhta.ua/v2.0/json/';

/**
 * Normalizes phone numbers to Nova Poshta's expected format (380XXXXXXXXX)
 */
const cleanPhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Prepend 38 if it's 10 digits (e.g., 0672657091)
  if (cleaned.length === 10) {
    cleaned = '38' + cleaned;
  }
  return cleaned;
};

// Hardcoded sender data
const SENDER = {
  firstName: 'Олексій',
  lastName: 'Щирий',
  middleName: 'Олександрович',
  city: 'Рівне',
  warehouse: 'Відділення №26',
  phone: '0672657091',
};

// Cached sender refs (module-level)
let cachedSenderCityRef = null;
let cachedSenderWarehouseRef = null;
let cachedSenderRef = null;
let cachedContactSenderRef = null;
let cachedSenderPhone = null;

/**
 * Base helper — calls Nova Poshta API
 */
const callApi = async (modelName, calledMethod, methodProperties = {}) => {
  try {
    const response = await axios.post(NP_API_URL, {
      apiKey: process.env.NOVA_POSHTA_API_KEY,
      modelName,
      calledMethod,
      methodProperties,
    });

    if (!response.data.success) {
      const errors = response.data.errors || [];
      const warnings = response.data.warnings || [];
      console.error(`Nova Poshta API error [${modelName}.${calledMethod}]:`, errors, warnings);
      throw new Error(`Nova Poshta API error: ${errors.join(', ') || warnings.join(', ')}`);
    }

    return response.data.data;
  } catch (error) {
    if (error.response) {
      console.error('Nova Poshta HTTP error:', error.response.status, error.response.data);
    }
    throw error;
  }
};

/**
 * Find city Ref by city name
 */
const findCityRef = async (cityName) => {
  try {
    // Try searchSettlements first
    const settlements = await callApi('Address', 'searchSettlements', {
      CityName: cityName,
      Limit: 5,
    });

    if (settlements && settlements.length > 0 && settlements[0].Addresses && settlements[0].Addresses.length > 0) {
      return settlements[0].Addresses[0].DeliveryCity || settlements[0].Addresses[0].Ref;
    }
  } catch (error) {
    console.warn('searchSettlements failed, trying getCities:', error.message);
  }

  // Fallback to getCities
  const cities = await callApi('Address', 'getCities', {
    FindByString: cityName,
  });

  if (cities && cities.length > 0) {
    return cities[0].Ref;
  }

  throw new Error(`City not found: ${cityName}`);
};

/**
 * Find warehouse Ref by cityRef and warehouse description text
 */
const findWarehouseRef = async (cityRef, warehouseDescription) => {
  const warehouses = await callApi('Address', 'getWarehouses', {
    CityRef: cityRef,
  });

  if (!warehouses || warehouses.length === 0) {
    throw new Error(`No warehouses found for city ref: ${cityRef}`);
  }

  const match = warehouses.find((w) =>
    w.Description && w.Description.includes(warehouseDescription)
  );

  if (match) {
    return match.Ref;
  }

  throw new Error(`Warehouse not found containing "${warehouseDescription}" in city ${cityRef}`);
};

/**
 * Get sender refs (city, warehouse, counterparty, contact person).
 * Results are cached at module level.
 */
const getSenderRefs = async () => {
  if (cachedSenderCityRef && cachedSenderWarehouseRef && cachedSenderRef && cachedContactSenderRef) {
    return {
      senderCityRef: cachedSenderCityRef,
      senderWarehouseRef: cachedSenderWarehouseRef,
      senderRef: cachedSenderRef,
      contactSenderRef: cachedContactSenderRef,
      senderPhone: cachedSenderPhone,
    };
  }

  // 1. Find sender city ref
  cachedSenderCityRef = await findCityRef(SENDER.city);

  // 2. Find sender warehouse ref
  cachedSenderWarehouseRef = await findWarehouseRef(cachedSenderCityRef, SENDER.warehouse);

  // 3. Get sender counterparty
  const counterparties = await callApi('Counterparty', 'getCounterparties', {
    CounterpartyProperty: 'Sender',
    Page: '1',
  });

  if (!counterparties || counterparties.length === 0) {
    throw new Error('No sender counterparty found');
  }

  cachedSenderRef = counterparties[0].Ref;

  // 4. Get contact person
  const contactPersons = await callApi('Counterparty', 'getCounterpartyContactPersons', {
    Ref: cachedSenderRef,
    Page: '1',
  });

  if (!contactPersons || contactPersons.length === 0) {
    throw new Error('No contact person found for sender counterparty');
  }

  cachedContactSenderRef = contactPersons[0].Ref;
  cachedSenderPhone = cleanPhone(SENDER.phone);

  return {
    senderCityRef: cachedSenderCityRef,
    senderWarehouseRef: cachedSenderWarehouseRef,
    senderRef: cachedSenderRef,
    contactSenderRef: cachedContactSenderRef,
    senderPhone: cachedSenderPhone,
  };
};

/**
 * Create recipient counterparty
 */
const createRecipientCounterparty = async (firstName, lastName, middleName, phone, cityRef) => {
  const cleanedPhone = cleanPhone(phone);
  const result = await callApi('Counterparty', 'save', {
    FirstName: firstName,
    LastName: lastName,
    MiddleName: middleName || '',
    Phone: cleanedPhone,
    CounterpartyType: 'PrivatePerson',
    CounterpartyProperty: 'Recipient',
    CityRef: cityRef,
  });

  if (!result || result.length === 0) {
    throw new Error('Failed to create recipient counterparty');
  }

  return {
    recipientRef: result[0].Ref,
    contactRecipientRef: result[0].ContactPerson?.data?.[0]?.Ref || result[0].Ref,
  };
};

/**
 * Create internet document (waybill / TTN)
 */
const createInternetDocument = async (params) => {
  const {
    senderCityRef,
    senderRef,
    senderAddressRef,
    contactSenderRef,
    senderPhone,
    recipientRef,
    recipientAddressRef,
    contactRecipientRef,
    recipientPhone,
    recipientCityRef,
    description,
    cost,
    serviceType = 'WarehouseWarehouse',
    weight = '2',
    width = '1',
    height = '1',
    length = '1',
    comment = '',
  } = params;

  // Format current date as DD.MM.YYYY in Europe/Kiev timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Kiev',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const day = parts.find(p => p.type === 'day').value;
  const month = parts.find(p => p.type === 'month').value;
  const year = parts.find(p => p.type === 'year').value;
  const dateTime = `${day}.${month}.${year}`;

  const methodProperties = {
    SenderWarehouseIndex: '',
    RecipientWarehouseIndex: '',
    PayerType: 'Recipient',
    PaymentMethod: 'Cash',
    DateTime: dateTime,
    CargoType: 'Cargo',
    Weight: String(weight),
    Width: String(width),
    Height: String(height),
    Length: String(length),
    SeatsAmount: '1',
    Description: description,
    Cost: String(cost),
    ServiceType: serviceType,
    Sender: senderRef,
    SenderAddress: senderAddressRef,
    ContactSender: contactSenderRef,
    SendersPhone: cleanPhone(senderPhone),
    Recipient: recipientRef,
    RecipientAddress: recipientAddressRef,
    ContactRecipient: contactRecipientRef,
    RecipientsPhone: cleanPhone(recipientPhone),
    CitySender: senderCityRef,
    CityRecipient: recipientCityRef,
    RecipientCityName: '',
    RecipientArea: '',
    RecipientAreaRegions: '',
    RecipientAddressName: '',
  };

  if (comment) {
    methodProperties.AdditionalInformation = comment;
  }

  const result = await callApi('InternetDocument', 'save', methodProperties);

  if (!result || result.length === 0) {
    throw new Error('Failed to create internet document');
  }

  return {
    ttn: result[0].IntDocNumber,
    ref: result[0].Ref,
    costOnSite: result[0].CostOnSite,
    estimatedDeliveryDate: result[0].EstimatedDeliveryDate,
  };
};

/**
 * Get tracking info for a TTN number
 */
const getTrackingInfo = async (ttnNumber) => {
  const result = await callApi('TrackingDocument', 'getStatusDocuments', {
    Documents: [
      { DocumentNumber: ttnNumber },
    ],
  });

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
};

/**
 * Find street Ref by street name
 */
const findStreetRef = async (cityRef, streetName) => {
  const streets = await callApi('Address', 'getStreet', {
    CityRef: cityRef,
    FindByString: streetName,
  });

  if (!streets || streets.length === 0) {
    throw new Error(`Street not found: ${streetName}`);
  }

  const match = streets.find((s) =>
    s.Description && s.Description.toLowerCase().includes(streetName.toLowerCase())
  );

  return match ? match.Ref : streets[0].Ref;
};

/**
 * Create recipient address for courier delivery
 */
const createRecipientAddress = async (recipientRef, streetRef, buildingNumber, flat) => {
  const result = await callApi('Address', 'save', {
    CounterpartyRef: recipientRef,
    StreetRef: streetRef,
    BuildingNumber: buildingNumber || '',
    Flat: flat || '',
  });

  if (!result || result.length === 0) {
    throw new Error('Failed to create recipient address');
  }

  return result[0].Ref;
};

module.exports = {
  callApi,
  findCityRef,
  findWarehouseRef,
  getSenderRefs,
  createRecipientCounterparty,
  createInternetDocument,
  getTrackingInfo,
  findStreetRef,
  createRecipientAddress,
};
