
export interface LastFmImage {
  '#text': string;
  size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega' | '';
}

export interface LastFmArtist {
  name: string;
  playcount: string;
  listeners?: string;
  mbid?: string;
  url?: string;
  image?: LastFmImage[];
  '@attr'?: {
    rank: string;
  };
}

export interface TopArtistsResponse {
  topartists: {
    artist: LastFmArtist[];
    '@attr': {
      user: string;
      page: string;
      perPage: string;
      totalPages: string;
      total: string;
    };
  };
}

export type LastFmPeriod =
  | 'overall'
  | '12month'
  | '6month'
  | '3month'
  | '1month'
  | '7day';
