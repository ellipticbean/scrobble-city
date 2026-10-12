
import type { LastFmArtist } from '../types/lastfm';
import type { CityBuilding, CityData } from '../types/city';

// Convert artist playcounts into building heights.

function scaleStories(
    playcount: number,
    min: number,
    max: number
): number {
    if (max <= min) return 3;

    // Logarithmic scaling helps distribute heights
    // more evenly when top artists dominate playcounts.
    const logMin = Math.log1p(Math.max(0, min));
    const logMax = Math.log1p(Math.max(0, max));
    const logPlaycount = Math.log1p(Math.max(0, playcount));

    const normalized =
        (logPlaycount - logMin) / (logMax - logMin);

    const stories = Math.round(2 + normalized * 6);

    return Math.max(2, Math.min(8, stories));
}


// Generate a city from a Last.fm user's artists.
export function generateCity(
    username: string,
    artists: LastFmArtist[],
    // Scale heights against the entire city's artist chart,
    // not the fifteen artists in the currently selected district.
    referenceArtists: readonly LastFmArtist[] = artists
): CityData {

    const parsedArtists = artists.map((artist, index) => ({
        ...artist,
        playcountNum: Number(artist.playcount) || 0,
        rankNum: Number(artist['@attr']?.rank) || index + 1,
    }));

    const playcounts = referenceArtists
        .map((artist) => Number(artist.playcount))
        .filter((count) => Number.isFinite(count) && count >= 0);

    const min = playcounts.length ? Math.min(...playcounts) : 0;
    const max = playcounts.length ? Math.max(...playcounts) : 0;

    // Permanent city landmarks.
    const buildings: CityBuilding[] = [
        {
            id: 'city-hall',
            type: 'cityHall',
            name: 'Department of Musical Affairs',
            x: 1,
            y: 0,
            width: 2,
            height: 2,
            stories: 4,
            description:
                'The official headquarters for investigating questionable musical behavior.',
        },
        {
            id: 'clock-tower',
            type: 'clockTower',
            name: 'The Music Time Machine',
            x: 4,
            y: 0,
            width: 2,
            height: 2,
            stories: 5,
            description:
                'Travel back through your listening history and rediscover forgotten favorites.',
        },
        {
            id: 'matchmaking-agency',
            type: 'matchmakingAgency',
            name: 'Music Taste Matchmaking Agency',
            x: 7,
            y: 0,
            width: 2,
            height: 2,
            stories: 3,
            description:
                'Find out what your music taste says about your love life.',
        },
        {
            id: 'census-office',
            type: 'censusOffice',
            name: 'Scrobble City Census Office',
            x: 9,
            y: 0,
            width: 2,
            height: 2,
            stories: 4,
            description:
                'The Bureau of Population Changes & Musical Migration. ' +
                'Compare different years of listening history ' +
                'and discover how your musical city evolved.',
        },
        {
            id: 'record-shop',
            type: 'recordShop',
            name: 'The Needle & Nook',
            // South of the final artist block, just beyond the fourth road.
            // The first 15 artists occupy y=3,5,7; this lot is never used.
            x: 1,
            y: 9,
            width: 2,
            height: 1,
            stories: 2,
            description: 'An enterable neighborhood record shop with imaginary albums, a listening nook, and Marigold the shopkeeper.',
        },

    ];

    // Artist buildings start below the landmarks.
    const columns = 5;
    const startY = 3;

    parsedArtists.forEach((artist, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);

        const stories = scaleStories(
            artist.playcountNum,
            min,
            max
        );

        buildings.push({
            id: `artist-${artist.rankNum}-${index}`,
            type: 'artist',
            name: artist.name,
            x: 1 + column * 2,
            y: startY + row * 2,
            width: 1,
            height: 1,
            stories,
            playcount: artist.playcountNum,
            rank: artist.rankNum,
            description:
                `${artist.name} is your #${artist.rankNum} artist ` +
                `with ${artist.playcountNum.toLocaleString()} scrobbles.`,
        });
    });

    return {
        username,
        buildings,
    };
}
