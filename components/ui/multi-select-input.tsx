'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectInputProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxSelected?: number;
  className?: string;
}

export function MultiSelectInput({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  maxSelected,
  className
}: MultiSelectInputProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedValue: string) => {
    const isSelected = value.includes(selectedValue);

    if (isSelected) {
      onChange(value.filter((item) => item !== selectedValue));
    } else {
      if (maxSelected && value.length >= maxSelected) {
        return; // No permitir más selecciones si se alcanzó el máximo
      }
      onChange([...value, selectedValue]);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(value.filter((item) => item !== valueToRemove));
  };

  const selectedLabels = value.map((val) => {
    const option = options.find((opt) => opt.value === val);
    return option ? option.label : val;
  });

  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder;
    }
    if (value.length === 1) {
      return selectedLabels[0];
    }
    return `${value.length} seleccionados`;
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandList>
              <CommandEmpty>No se encontraron opciones.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Mostrar elementos seleccionados como badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((val) => {
            const option = options.find((opt) => opt.value === val);
            const label = option ? option.label : val;

            return (
              <Badge
                key={val}
                variant="secondary"
                className="text-xs"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(val);
                  }}
                  className="ml-1 hover:bg-gray-300 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Indicador de límite si está configurado */}
      {maxSelected && (
        <div className="text-xs text-gray-500 mt-1">
          {value.length}/{maxSelected} seleccionados
        </div>
      )}
    </div>
  );
}