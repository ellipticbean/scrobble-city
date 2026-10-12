

export type LandmarkType =
  | 'cityHall'
  | 'clockTower'
  | 'matchmakingAgency'
  | 'censusOffice'
  | 'recordShop'
  | 'artist';


export interface CityBuilding {
  id: string;
  type: LandmarkType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stories: number;
  playcount?: number;
  rank?: number;
  description?: string;
}

export interface CityData {
  username: string;
  buildings: CityBuilding[];
}
