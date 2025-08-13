export interface Country {
  id: string;
  name: string;
  code: string;
  continent: string;
  createdAt: string;
  updatedAt: string;
  states?: State[];
}

export interface State {
  id: string;
  name: string;
  code: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  cities?: City[];
}

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  pincodes?: Pincode[];
}

export interface Pincode {
  id: string;
  code: string;
  area: string;
  cityId: string;
  createdAt: string;
  updatedAt: string;
  city?: City;
}

export interface CreateCountryData {
  name: string;
  code: string;
  continent: string;
}

export interface UpdateCountryData {
  name?: string;
  code?: string;
  continent?: string;
}

export interface CreateStateData {
  name: string;
  code: string;
  country: string;
}

export interface UpdateStateData {
  name?: string;
  code?: string;
  country?: string;
}

export interface CreateCityData {
  name: string;
  state: string;
  country: string;
}

export interface UpdateCityData {
  name?: string;
  state?: string;
  country?: string;
}

export interface CreatePincodeData {
  code: string;
  area: string;
  cityId: string;
}

export interface UpdatePincodeData {
  code?: string;
  area?: string;
  cityId?: string;
}
