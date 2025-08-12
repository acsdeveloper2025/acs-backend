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
