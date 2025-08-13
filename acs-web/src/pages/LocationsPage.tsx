import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Upload, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locationsService } from '@/services/locations';
import { CitiesTable } from '@/components/locations/CitiesTable';
import { PincodesTable } from '@/components/locations/PincodesTable';
import { CreateCityDialog } from '@/components/locations/CreateCityDialog';
import { CreatePincodeDialog } from '@/components/locations/CreatePincodeDialog';
import { BulkImportLocationDialog } from '@/components/locations/BulkImportLocationDialog';

export function LocationsPage() {
  const [activeTab, setActiveTab] = useState('cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [showCreateCity, setShowCreateCity] = useState(false);
  const [showCreatePincode, setShowCreatePincode] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportType, setBulkImportType] = useState<'cities' | 'pincodes'>('cities');

  // Fetch data based on active tab and filters
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities', searchQuery, selectedState, selectedCountry],
    queryFn: () => locationsService.getCities({
      search: searchQuery,
      state: selectedState !== 'all' ? selectedState : undefined,
      country: selectedCountry !== 'all' ? selectedCountry : undefined,
    }),
    enabled: activeTab === 'cities',
  });

  const { data: pincodesData, isLoading: pincodesLoading } = useQuery({
    queryKey: ['pincodes', searchQuery],
    queryFn: () => locationsService.getPincodes({ search: searchQuery }),
    enabled: activeTab === 'pincodes',
  });

  // Fetch states and countries for filters
  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: () => locationsService.getStates(),
  });

  const { data: countriesData } = useQuery({
    queryKey: ['countries'],
    queryFn: () => locationsService.getCountries(),
  });

  const handleBulkImport = (type: 'cities' | 'pincodes') => {
    setBulkImportType(type);
    setShowBulkImport(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedCountry('all');
  };

  const getTabStats = () => {
    return {
      cities: citiesData?.data?.length || 0,
      pincodes: pincodesData?.data?.length || 0,
    };
  };

  const stats = getTabStats();
  const states = statesData?.data || [];
  const countries = countriesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Manage cities, states, pincodes, and geographical data
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cities}</div>
            <p className="text-xs text-muted-foreground">
              Across all states and countries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pincodes</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pincodes}</div>
            <p className="text-xs text-muted-foreground">
              Postal codes across all cities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Location Database</CardTitle>
              <CardDescription>
                Manage geographical data including cities, states, and postal codes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="cities">
                  Cities
                  {stats.cities > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.cities}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pincodes">
                  Pincodes
                  {stats.pincodes > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.pincodes}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {activeTab === 'cities' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkImport('cities')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Cities
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowCreateCity(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add City
                    </Button>
                  </>
                )}
                
                {activeTab === 'pincodes' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkImport('pincodes')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Pincodes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowCreatePincode(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pincode
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {activeTab === 'cities' && (
                <>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state.id || state.name} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {(searchQuery || selectedState !== 'all' || selectedCountry !== 'all') && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            <TabsContent value="cities" className="space-y-4">
              <CitiesTable
                data={citiesData?.data || []}
                isLoading={citiesLoading}
              />
            </TabsContent>

            <TabsContent value="pincodes" className="space-y-4">
              <PincodesTable
                data={pincodesData?.data || []}
                isLoading={pincodesLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateCityDialog
        open={showCreateCity}
        onOpenChange={setShowCreateCity}
      />
      
      <CreatePincodeDialog
        open={showCreatePincode}
        onOpenChange={setShowCreatePincode}
      />
      
      <BulkImportLocationDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        type={bulkImportType}
      />
    </div>
  );
}
