import { useEffect, useState } from 'react';

import type { CityData } from '../types/city';

import MusicCompatibilityPanel from './MusicCompatibilityPanel';

interface MusicDatingProfileProps {

    city: CityData;

    eraLabel: string;

    onClose: () => void;

    onComparisonSuccess?: (score: number) => void;

    demo?: boolean;

}

type BioStyle = 'sweet' | 'chaotic' | 'dramatic';

export default function MusicDatingProfile({

    city,

    eraLabel,

    onClose,

    onComparisonSuccess,

    demo = false,

}: MusicDatingProfileProps) {

    const [bioStyle, setBioStyle] =

        useState<BioStyle>('sweet');

    const [copied, setCopied] = useState(false);

    const [copyError, setCopyError] = useState('');

    // Retrieve artists from the currently selected city.

    const artists = city.buildings

        .filter((building) => building.type === 'artist')

        .sort(

            (a, b) =>

                (a.rank ?? 999) - (b.rank ?? 999)

        );

    const favorite = artists[0];

    const second = artists[1];

    const third = artists[2];

    const favoriteName = favorite?.name ?? 'mysterious music';

    const secondName = second?.name ?? 'new discoveries';

    const thirdName = third?.name ?? 'old favorites';

    const totalPlays = artists.reduce(

        (sum, artist) => sum + (artist.playcount ?? 0),

        0

    );

    const topThreePlays = artists

        .slice(0, 3)

        .reduce(

            (sum, artist) => sum + (artist.playcount ?? 0),

            0

        );

    const favoriteShare = totalPlays

        ? Math.round(

            ((favorite?.playcount ?? 0) / totalPlays) * 100

        )

        : 0;

    const topThreeShare = totalPlays

        ? Math.round((topThreePlays / totalPlays) * 100)

        : 0;

    // A playful persona based on actual listening distribution.

    const persona =

        favoriteShare >= 35

            ? 'The Devoted Romantic'

            : topThreeShare >= 60

                ? 'The Faithful Favorite'

                : 'The Musical Wanderer';

    const [activeTab, setActiveTab] =

        useState<'profile' | 'compatibility'>('profile');

    const bios: Record<BioStyle, string> = {

        sweet:

            `Looking for someone to share headphones, ` +

            `trade playlists, and listen to ${favoriteName} ` +

            `on long drives. Bonus points if you can ` +

            `appreciate ${secondName} too.`,

        chaotic:

            `Emotionally available, but my aux cord is ` +

            `in a committed relationship with ${favoriteName}. ` +

            `I come with approximately ${artists.length} ` +

            `musical personalities and zero apologies.`,

        dramatic:

            `Somewhere between ${favoriteName} and ` +

            `${secondName}, I lost myself and found ` +

            `an entire soundtrack. Seeking someone ` +

            `willing to be the next track.`,

    };

    const currentBio = bios[bioStyle];

    const greenFlags = [

        `Has excellent commitment: ${favoriteName} ` +

        `has earned ${(favorite?.playcount ?? 0).toLocaleString()} ` +

        `scrobbles in this city.`,

        `Can introduce you to ${artists.length} ` +

        `different artists represented in their neighborhood.`,

        `Already has a soundtrack prepared for ` +

        `the first date, probably involving ${thirdName}.`,

    ];

    const redFlags = [

        `Has constructed a ${favorite?.stories ?? 2}-story ` +

        `building dedicated entirely to ${favoriteName}.`,

        `May bring up ${secondName} during completely ` +

        `unrelated conversations.`,

        topThreeShare >= 50

            ? `Their top three artists account for ${topThreeShare}% ` +

            `of scrobbles among the artists displayed here. ` +

            `You are competing with an established inner circle.`

            : `Their musical attention is spread across ` +

            `multiple favorites. Good luck getting them ` +

            `to choose just one song.`,

    ];

    useEffect(() => {

        function handleEscape(event: KeyboardEvent) {

            if (event.key === 'Escape') {

                onClose();

            }

        }

        window.addEventListener('keydown', handleEscape);

        return () => {

            window.removeEventListener('keydown', handleEscape);

        };

    }, [onClose]);

    async function copyProfile() {

        const profileText = [

            `💌 ${city.username}'s Musical Dating Profile`,

            `Era: ${eraLabel}`,

            `Musical persona: ${persona}`,

            '',

            currentBio,

            '',

            `Favorite artist: ${favoriteName}`,

            `Runner-up: ${secondName}`,

            `Third favorite: ${thirdName}`,

            '',

            `Green flag: ${greenFlags[0]}`,

            `Red flag: ${redFlags[0]}`,

            '',

            'Made in Scrobble City ♪',

        ].join('\n');

        try {

            await navigator.clipboard.writeText(profileText);

            setCopied(true);

            setCopyError('');

        } catch {

            setCopyError(

                'Could not copy automatically. ' +

                'Please check clipboard permissions.'

            );

        }

    }

    return (

        <div className="dating-overlay">

            <section

                className="dating-window"

                role="dialog"

                aria-modal="true"

                aria-labelledby="dating-title"

            >

                <header className="dating-header">

                    <div>

                        <span>SCROBBLE CITY MATCHMAKING AGENCY</span>

                        <h2 id="dating-title">

                            💌 Music Taste Dating Profile

                        </h2>

                        <p>

                            Finding love, one questionable scrobble

                            at a time.

                        </p>

                    </div>

                    <button

                        type="button"

                        className="dating-close"

                        onClick={onClose}

                        aria-label="Close Matchmaking Agency"

                    >

                        ✕

                    </button>

                </header>

                <div className="dating-content">

                    <div

                        className="dating-tabs"

                        aria-label="Matchmaking Agency features"

                    >

                        <button

                            type="button"

                            className={activeTab === 'profile' ? 'active' : ''}

                            onClick={() => setActiveTab('profile')}

                            aria-pressed={activeTab === 'profile'}

                        >

                            💌 My Dating Profile

                        </button>

                        <button

                            type="button"

                            className={activeTab === 'compatibility' ? 'active' : ''}

                            onClick={() => setActiveTab('compatibility')}

                            aria-pressed={activeTab === 'compatibility'}

                        >

                            💕 Compare Two Listeners

                        </button>

                    </div>

                    {activeTab === 'profile' ? (

                        <div className="dating-profile-card">

                            <div className="dating-profile-heading">

                                <span>♡ OFFICIAL MATCHMAKING PROFILE ♡</span>

                                <h3>{city.username}</h3>

                                <p>{persona}</p>

                                <small>Listening era: {eraLabel}</small>

                            </div>

                            <div className="dating-heart-divider">

                                ♥ ♥ ♥

                            </div>

                            <h4>About Me</h4>

                            <p className="dating-bio">

                                {currentBio}

                            </p>

                            <div className="dating-bio-options">

                                <button

                                    type="button"

                                    className={

                                        bioStyle === 'sweet' ? 'active' : ''

                                    }

                                    onClick={() => {

                                        setBioStyle('sweet');

                                        setCopied(false);

                                    }}

                                >

                                    🌸 Sweet

                                </button>

                                <button

                                    type="button"

                                    className={

                                        bioStyle === 'chaotic' ? 'active' : ''

                                    }

                                    onClick={() => {

                                        setBioStyle('chaotic');

                                        setCopied(false);

                                    }}

                                >

                                    🔥 Chaotic

                                </button>

                                <button

                                    type="button"

                                    className={

                                        bioStyle === 'dramatic' ? 'active' : ''

                                    }

                                    onClick={() => {

                                        setBioStyle('dramatic');

                                        setCopied(false);

                                    }}

                                >

                                    🎭 Dramatic

                                </button>

                            </div>

                            <div className="dating-favorites">

                                <h4>My Musical Crushes</h4>

                                <div>

                                    <span>🥇 #1</span>

                                    <strong>{favoriteName}</strong>

                                </div>

                                <div>

                                    <span>🥈 #2</span>

                                    <strong>{secondName}</strong>

                                </div>

                                <div>

                                    <span>🥉 #3</span>

                                    <strong>{thirdName}</strong>

                                </div>

                            </div>

                            <div className="dating-flags">

                                <section>

                                    <h4>💚 Green Flags</h4>

                                    <ul>

                                        {greenFlags.map((flag, index) => (

                                            <li key={index}>{flag}</li>

                                        ))}

                                    </ul>

                                </section>

                                <section>

                                    <h4>🚩 Red Flags</h4>

                                    <ul>

                                        {redFlags.map((flag, index) => (

                                            <li key={index}>{flag}</li>

                                        ))}

                                    </ul>

                                </section>

                            </div>

                            <div className="dating-verdict">

                                <span>OFFICIAL MATCHMAKING CLASSIFICATION</span>

                                <strong>{persona}</strong>

                                <p>

                                    Certified by the Scrobble City

                                    Department of Romantic Speculation.

                                </p>

                            </div>

                            <button

                                type="button"

                                className="dating-copy-button"

                                onClick={() => {

                                    void copyProfile();

                                }}

                            >

                                {copied

                                    ? '✓ PROFILE COPIED!'

                                    : '💌 COPY MY DATING PROFILE'}

                            </button>

                            {copyError && (

                                <p role="alert">{copyError}</p>

                            )}

                            <p className="dating-disclaimer">

                                These are playful fictional observations,

                                not genuine personality assessments.

                                Percentages, including the

                                {' '}{favoriteShare}% favorite-artist share,

                                describe only the top artists displayed

                                in this city.

                            </p>

                        </div>

                    ) : (

                        <MusicCompatibilityPanel

                            username={city.username}

                            disabled={demo}
                            onComparisonSuccess={onComparisonSuccess}

                        />

                    )}

                </div>

                <footer className="dating-footer">

                    SCROBBLE CITY MATCHMAKING AUTHORITY • EST. 2026

                </footer>

            </section>

        </div>

    );

}
