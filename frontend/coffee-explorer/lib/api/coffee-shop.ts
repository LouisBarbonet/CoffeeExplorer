export type LocationDetails = {
    id: string;
    address: string | null;
    city: string | null;
    country: string | null;
    latitude: number;
    longitude: number;
    coffeeShopId: string;
};

export type PhotoDetails = {
    id: string;
    url: string;
    caption: string | null;
    coffeeShopId: string;
};

export type CoffeeShop = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    location: LocationDetails | null; // Nested relation object from Prisma
    photos: PhotoDetails[];
};