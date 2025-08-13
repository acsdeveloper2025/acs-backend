import { Request, Response } from 'express';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/config/db';

// Mock data for demonstration (replace with actual database operations)
const countries = [
  {
    id: 'country_1',
    name: 'India',
    code: 'IN',
    iso3: 'IND',
    phoneCode: '+91',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    isActive: true,
  },
  {
    id: 'country_2',
    name: 'United States',
    code: 'US',
    iso3: 'USA',
    phoneCode: '+1',
    currency: 'USD',
    timezone: 'America/New_York',
    isActive: true,
  },
  {
    id: 'country_3',
    name: 'United Kingdom',
    code: 'GB',
    iso3: 'GBR',
    phoneCode: '+44',
    currency: 'GBP',
    timezone: 'Europe/London',
    isActive: true,
  },
];

const states = [
  // Indian States
  { id: 'state_1', name: 'Maharashtra', country: 'India', code: 'MH', capital: 'Mumbai', isActive: true },
  { id: 'state_2', name: 'Delhi', country: 'India', code: 'DL', capital: 'New Delhi', isActive: true },
  { id: 'state_3', name: 'Karnataka', country: 'India', code: 'KA', capital: 'Bangalore', isActive: true },
  { id: 'state_4', name: 'Tamil Nadu', country: 'India', code: 'TN', capital: 'Chennai', isActive: true },
  { id: 'state_5', name: 'Gujarat', country: 'India', code: 'GJ', capital: 'Gandhinagar', isActive: true },
  { id: 'state_6', name: 'Rajasthan', country: 'India', code: 'RJ', capital: 'Jaipur', isActive: true },
  { id: 'state_7', name: 'West Bengal', country: 'India', code: 'WB', capital: 'Kolkata', isActive: true },
  { id: 'state_8', name: 'Uttar Pradesh', country: 'India', code: 'UP', capital: 'Lucknow', isActive: true },
  { id: 'state_9', name: 'Madhya Pradesh', country: 'India', code: 'MP', capital: 'Bhopal', isActive: true },
  { id: 'state_10', name: 'Andhra Pradesh', country: 'India', code: 'AP', capital: 'Amaravati', isActive: true },
  { id: 'state_11', name: 'Telangana', country: 'India', code: 'TG', capital: 'Hyderabad', isActive: true },
  { id: 'state_12', name: 'Kerala', country: 'India', code: 'KL', capital: 'Thiruvananthapuram', isActive: true },
  { id: 'state_13', name: 'Punjab', country: 'India', code: 'PB', capital: 'Chandigarh', isActive: true },
  { id: 'state_14', name: 'Haryana', country: 'India', code: 'HR', capital: 'Chandigarh', isActive: true },
  { id: 'state_15', name: 'Bihar', country: 'India', code: 'BR', capital: 'Patna', isActive: true },
  { id: 'state_16', name: 'Odisha', country: 'India', code: 'OR', capital: 'Bhubaneswar', isActive: true },
  { id: 'state_17', name: 'Jharkhand', country: 'India', code: 'JH', capital: 'Ranchi', isActive: true },
  { id: 'state_18', name: 'Assam', country: 'India', code: 'AS', capital: 'Dispur', isActive: true },
  { id: 'state_19', name: 'Chhattisgarh', country: 'India', code: 'CG', capital: 'Raipur', isActive: true },
  { id: 'state_20', name: 'Uttarakhand', country: 'India', code: 'UK', capital: 'Dehradun', isActive: true },
  { id: 'state_21', name: 'Himachal Pradesh', country: 'India', code: 'HP', capital: 'Shimla', isActive: true },
  { id: 'state_22', name: 'Jammu and Kashmir', country: 'India', code: 'JK', capital: 'Srinagar', isActive: true },
  { id: 'state_23', name: 'Goa', country: 'India', code: 'GA', capital: 'Panaji', isActive: true },
  { id: 'state_24', name: 'Manipur', country: 'India', code: 'MN', capital: 'Imphal', isActive: true },
  { id: 'state_25', name: 'Meghalaya', country: 'India', code: 'ML', capital: 'Shillong', isActive: true },
  { id: 'state_26', name: 'Tripura', country: 'India', code: 'TR', capital: 'Agartala', isActive: true },
  { id: 'state_27', name: 'Nagaland', country: 'India', code: 'NL', capital: 'Kohima', isActive: true },
  { id: 'state_28', name: 'Mizoram', country: 'India', code: 'MZ', capital: 'Aizawl', isActive: true },
  { id: 'state_29', name: 'Arunachal Pradesh', country: 'India', code: 'AR', capital: 'Itanagar', isActive: true },
  { id: 'state_30', name: 'Sikkim', country: 'India', code: 'SK', capital: 'Gangtok', isActive: true },
  
  // US States (sample)
  { id: 'state_31', name: 'California', country: 'United States', code: 'CA', capital: 'Sacramento', isActive: true },
  { id: 'state_32', name: 'New York', country: 'United States', code: 'NY', capital: 'Albany', isActive: true },
  { id: 'state_33', name: 'Texas', country: 'United States', code: 'TX', capital: 'Austin', isActive: true },
  { id: 'state_34', name: 'Florida', country: 'United States', code: 'FL', capital: 'Tallahassee', isActive: true },
  
  // UK Counties (sample)
  { id: 'state_35', name: 'England', country: 'United Kingdom', code: 'ENG', capital: 'London', isActive: true },
  { id: 'state_36', name: 'Scotland', country: 'United Kingdom', code: 'SCT', capital: 'Edinburgh', isActive: true },
  { id: 'state_37', name: 'Wales', country: 'United Kingdom', code: 'WLS', capital: 'Cardiff', isActive: true },
  { id: 'state_38', name: 'Northern Ireland', country: 'United Kingdom', code: 'NIR', capital: 'Belfast', isActive: true },
];

// GET /api/locations/countries - Get countries list
export const getCountries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get countries from database
    const sql = `
      SELECT id, name, code, created_at as "createdAt", updated_at as "updatedAt"
      FROM countries
      ORDER BY name ASC
    `;

    const result = await query(sql);

    logger.info(`Retrieved ${result.rows.length} countries`, {
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error retrieving countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve countries',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/locations/states - Get states list
export const getStates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.info('getStates called', { country: req.query.country, userId: req.user?.id });
    const { country = 'India' } = req.query;

    // Get states from database with country filter
    let sql = `
      SELECT s.id, s.name, s.code, c.name as country, s.created_at as "createdAt", s.updated_at as "updatedAt"
      FROM states s
      JOIN countries c ON s.country_id = c.id
      WHERE c.name = $1
      ORDER BY s.name ASC
    `;

    logger.info('About to execute query', { sql, params: [country] });

    try {
      const result = await query(sql, [country]);
      logger.info('Query executed successfully', { rowCount: result.rows.length });

      logger.info(`Retrieved ${result.rows.length} states for ${country}`, {
        userId: req.user?.id,
        country
      });

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (queryError) {
      logger.error('Database query failed:', queryError);
      res.status(500).json({
        success: false,
        message: 'Database query failed',
        error: { code: 'QUERY_ERROR' },
      });
    }
  } catch (error) {
    logger.error('Error retrieving states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve states',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/locations/regions - Get regions list
export const getRegions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { country = 'India' } = req.query;

    // Define regions based on country
    let regions: string[] = [];

    switch (country) {
      case 'India':
        regions = [
          'Northern',
          'Southern',
          'Eastern',
          'Western',
          'Central',
          'North-Eastern',
        ];
        break;
      case 'United States':
        regions = [
          'Northeast',
          'Southeast',
          'Midwest',
          'Southwest',
          'West',
          'Pacific',
        ];
        break;
      case 'United Kingdom':
        regions = [
          'England',
          'Scotland',
          'Wales',
          'Northern Ireland',
        ];
        break;
      default:
        regions = ['Unknown'];
    }

    logger.info(`Retrieved ${regions.length} regions for ${country}`, { 
      userId: req.user?.id,
      country
    });

    res.json({
      success: true,
      data: regions,
    });
  } catch (error) {
    logger.error('Error retrieving regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve regions',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/locations/timezones - Get timezones list
export const getTimezones = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { country } = req.query;

    let timezones: string[] = [];

    if (country) {
      // Filter timezones by country
      const countryData = countries.find(c => c.name === country);
      if (countryData) {
        timezones = [countryData.timezone];
      }
    } else {
      // Return all common timezones
      timezones = [
        'Asia/Kolkata',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Asia/Dubai',
        'Asia/Singapore',
        'America/Chicago',
      ];
    }

    res.json({
      success: true,
      data: timezones,
    });
  } catch (error) {
    logger.error('Error retrieving timezones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve timezones',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/locations/currencies - Get currencies list
export const getCurrencies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currencies = [
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
      { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
      { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
      { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates' },
    ];

    res.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    logger.error('Error retrieving currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve currencies',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};

// GET /api/locations/phone-codes - Get phone codes list
export const getPhoneCodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const phoneCodes = countries.map(country => ({
      country: country.name,
      code: country.code,
      phoneCode: country.phoneCode,
    }));

    res.json({
      success: true,
      data: phoneCodes,
    });
  } catch (error) {
    logger.error('Error retrieving phone codes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve phone codes',
      error: { code: 'INTERNAL_ERROR' },
    });
  }
};
