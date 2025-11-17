import React from 'react';

interface PropertyInfoProps {
  listing: any;
}

export default function PropertyInfo({ listing }: PropertyInfoProps) {
  if (!listing) return null;

  // Extract property details - handle various field name variations
  const bedrooms = listing.bedrooms || listing.beds || listing.bedroom_count || listing.bedrooms_count || null;
  const bathrooms = listing.bathrooms || listing.baths || listing.bathroom_count || listing.bathrooms_count || listing.bath || null;
  const squareFeet = listing.square_feet || listing.sqft || listing.squarefeet || listing.area || listing.living_area || null;
  const propertyType = listing.property_type || listing.type || listing.propertytype || listing.home_type || null;

  // If no data available, don't show the component
  if (!bedrooms && !bathrooms && !squareFeet && !propertyType) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <h3 className="text-sm font-semibold text-[#111827] dark:text-gray-200 mb-3">Property Details</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bedrooms !== null && (
          <div>
            <div className="text-xs text-[#6B7280] dark:text-gray-400 mb-1">Bedrooms</div>
            <div className="text-lg font-semibold text-[#111827] dark:text-gray-200">{bedrooms}</div>
          </div>
        )}
        {bathrooms !== null && (
          <div>
            <div className="text-xs text-[#6B7280] dark:text-gray-400 mb-1">Bathrooms</div>
            <div className="text-lg font-semibold text-[#111827] dark:text-gray-200">
              {typeof bathrooms === 'number' ? bathrooms.toFixed(bathrooms % 1 !== 0 ? 1 : 0) : bathrooms}
            </div>
          </div>
        )}
        {squareFeet !== null && (
          <div>
            <div className="text-xs text-[#6B7280] dark:text-gray-400 mb-1">Square Feet</div>
            <div className="text-lg font-semibold text-[#111827] dark:text-gray-200">
              {typeof squareFeet === 'number' ? squareFeet.toLocaleString() : squareFeet}
            </div>
          </div>
        )}
        {propertyType !== null && (
          <div>
            <div className="text-xs text-[#6B7280] dark:text-gray-400 mb-1">Property Type</div>
            <div className="text-lg font-semibold text-[#111827] dark:text-gray-200 capitalize">
              {String(propertyType).replace(/_/g, ' ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

