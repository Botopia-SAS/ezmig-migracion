'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import type { AddressData } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

interface GoogleMapsAutocompleteProps {
  value: string;
  onAddressSelect: (addressData: AddressData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Type definitions para Google Maps API
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export function GoogleMapsAutocomplete({
  value,
  onAddressSelect,
  label = 'Dirección',
  placeholder = 'Ingresa tu dirección...',
  required = false,
  disabled = false,
  className
}: GoogleMapsAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Cargar Google Maps API dinámicamente cuando el usuario interactúa
  const loadGoogleMapsAPI = () => {
    if (window.google || document.querySelector('script[src*="maps.googleapis.com"]')) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    setIsLoading(true);

    // TODO: Reemplazar con tu API key real
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      setIsGoogleMapsLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error('Error loading Google Maps API');
      setIsLoading(false);
    };

    document.head.appendChild(script);
  };

  // Inicializar autocomplete cuando Google Maps esté cargado
  useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current || !window.google) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' }, // Solo direcciones en USA
      fields: [
        'address_components',
        'formatted_address',
        'geometry',
        'place_id'
      ]
    });

    autocompleteRef.current = autocomplete;

    // Manejar selección de dirección
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.address_components) {
        return;
      }

      // Parsear componentes de dirección
      const addressData = parseAddressComponents(place);

      if (addressData) {
        setInputValue(addressData.address);
        onAddressSelect(addressData);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isGoogleMapsLoaded, onAddressSelect]);

  // Parsear componentes de dirección de Google Maps
  const parseAddressComponents = (place: any): AddressData | null => {
    try {
      const components = place.address_components;
      let address = '';
      let city = '';
      let state = '';
      let zipCode = '';

      // Extraer componentes
      for (const component of components) {
        const types = component.types;

        if (types.includes('street_number')) {
          address = component.long_name + ' ';
        } else if (types.includes('route')) {
          address += component.long_name;
        } else if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name; // 'CA' en lugar de 'California'
        } else if (types.includes('postal_code')) {
          zipCode = component.long_name;
        }
      }

      // Validar que tengamos los campos mínimos
      if (!address.trim() || !city || !state) {
        console.warn('Incomplete address data from Google Maps');
        return null;
      }

      return {
        address: address.trim(),
        city,
        state,
        zipCode,
        placeId: place.place_id,
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
      };
    } catch (error) {
      console.error('Error parsing address components:', error);
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleFocus = () => {
    if (!isGoogleMapsLoaded && !isLoading) {
      loadGoogleMapsAPI();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="address-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="pl-10"
        />

        {/* Icono de ubicación */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Información de ayuda */}
      {!isGoogleMapsLoaded && !isLoading && (
        <p className="text-xs text-gray-500">
          🗺️ Las sugerencias de dirección se activarán automáticamente al hacer clic
        </p>
      )}

      {isLoading && (
        <p className="text-xs text-blue-600 flex items-center">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Cargando autocomplete de direcciones...
        </p>
      )}
    </div>
  );
}