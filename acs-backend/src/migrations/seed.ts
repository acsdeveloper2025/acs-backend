import { config } from 'dotenv';
config();

import { Pool } from 'pg';
import { logger } from '../config/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Seed data from the original mock data
const seedCountries = [
  { name: 'India', code: 'IN', continent: 'Asia' },
  { name: 'United States', code: 'US', continent: 'North America' },
  { name: 'United Kingdom', code: 'GB', continent: 'Europe' },
  { name: 'Canada', code: 'CA', continent: 'North America' },
  { name: 'Australia', code: 'AU', continent: 'Oceania' },
  { name: 'Germany', code: 'DE', continent: 'Europe' },
  { name: 'France', code: 'FR', continent: 'Europe' },
  { name: 'Japan', code: 'JP', continent: 'Asia' },
  { name: 'China', code: 'CN', continent: 'Asia' },
  { name: 'Brazil', code: 'BR', continent: 'South America' },
];

const seedStates = [
  // Indian States
  { name: 'Maharashtra', code: 'MH', country: 'India' },
  { name: 'Delhi', code: 'DL', country: 'India' },
  { name: 'Karnataka', code: 'KA', country: 'India' },
  { name: 'Tamil Nadu', code: 'TN', country: 'India' },
  { name: 'Gujarat', code: 'GJ', country: 'India' },
  { name: 'Rajasthan', code: 'RJ', country: 'India' },
  { name: 'West Bengal', code: 'WB', country: 'India' },
  { name: 'Uttar Pradesh', code: 'UP', country: 'India' },
  { name: 'Punjab', code: 'PB', country: 'India' },
  { name: 'Haryana', code: 'HR', country: 'India' },
  
  // US States
  { name: 'California', code: 'CA', country: 'United States' },
  { name: 'New York', code: 'NY', country: 'United States' },
  { name: 'Texas', code: 'TX', country: 'United States' },
  { name: 'Florida', code: 'FL', country: 'United States' },
];

const seedCities = [
  // Indian Cities
  { name: 'Mumbai', state: 'Maharashtra', country: 'India' },
  { name: 'Delhi', state: 'Delhi', country: 'India' },
  { name: 'Bangalore', state: 'Karnataka', country: 'India' },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  { name: 'Jaipur', state: 'Rajasthan', country: 'India' },
  { name: 'Kolkata', state: 'West Bengal', country: 'India' },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
  
  // US Cities
  { name: 'Los Angeles', state: 'California', country: 'United States' },
  { name: 'New York City', state: 'New York', country: 'United States' },
  { name: 'Houston', state: 'Texas', country: 'United States' },
  { name: 'Miami', state: 'Florida', country: 'United States' },
];

const seedPincodes = [
  // Mumbai Pincodes
  { code: '400001', area: 'Fort', city: 'Mumbai' },
  { code: '400002', area: 'Kalbadevi', city: 'Mumbai' },
  { code: '400003', area: 'Masjid Bunder', city: 'Mumbai' },
  { code: '400004', area: 'Girgaon', city: 'Mumbai' },
  
  // Delhi Pincodes
  { code: '110001', area: 'Connaught Place', city: 'Delhi' },
  { code: '110002', area: 'Darya Ganj', city: 'Delhi' },
  { code: '110003', area: 'New Delhi', city: 'Delhi' },
  
  // Bangalore Pincodes
  { code: '560001', area: 'Bangalore GPO', city: 'Bangalore' },
  { code: '560002', area: 'Bangalore City', city: 'Bangalore' },
  
  // US Pincodes
  { code: '90210', area: 'Beverly Hills', city: 'Los Angeles' },
  { code: '10001', area: 'Manhattan', city: 'New York City' },
];

export async function seedDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info('Starting database seeding...');
    
    // Check if data already exists
    const countryCount = await client.query('SELECT COUNT(*) FROM countries');
    if (parseInt(countryCount.rows[0].count) > 0) {
      logger.info('Database already seeded, skipping...');
      await client.query('ROLLBACK');
      return;
    }
    
    // Seed countries
    logger.info('Seeding countries...');
    const countryIds: { [key: string]: string } = {};
    
    for (const country of seedCountries) {
      const result = await client.query(
        'INSERT INTO countries (name, code, continent) VALUES ($1, $2, $3) RETURNING id',
        [country.name, country.code, country.continent]
      );
      countryIds[country.name] = result.rows[0].id;
    }
    
    // Seed states
    logger.info('Seeding states...');
    const stateIds: { [key: string]: string } = {};
    
    for (const state of seedStates) {
      const countryId = countryIds[state.country];
      if (countryId) {
        const result = await client.query(
          'INSERT INTO states (name, code, country_id) VALUES ($1, $2, $3) RETURNING id',
          [state.name, state.code, countryId]
        );
        stateIds[`${state.name}-${state.country}`] = result.rows[0].id;
      }
    }
    
    // Seed cities
    logger.info('Seeding cities...');
    const cityIds: { [key: string]: string } = {};
    
    for (const city of seedCities) {
      const stateId = stateIds[`${city.state}-${city.country}`];
      const countryId = countryIds[city.country];
      
      if (stateId && countryId) {
        const result = await client.query(
          'INSERT INTO cities (name, state_id, country_id) VALUES ($1, $2, $3) RETURNING id',
          [city.name, stateId, countryId]
        );
        cityIds[city.name] = result.rows[0].id;
      }
    }
    
    // Seed pincodes
    logger.info('Seeding pincodes...');
    for (const pincode of seedPincodes) {
      const cityId = cityIds[pincode.city];
      if (cityId) {
        await client.query(
          'INSERT INTO pincodes (code, area, city_id) VALUES ($1, $2, $3)',
          [pincode.code, pincode.area, cityId]
        );
      }
    }
    
    await client.query('COMMIT');
    logger.info('Database seeding completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI runner
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}
