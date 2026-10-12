import { useEffect, useRef, useState } from 'react';

import type { MusicCompatibilityReport } from '../lib/musicCompatibility';

interface CompatibilityCertificateProps {
    report: MusicCompatibilityReport;
}

const WIDTH = 640;
const HEIGHT = 460;

const palette = {
    ink: '#664d70',
    berry: '#a26789',
    pink: '#d58fb0',
    border: '#916d91',
    cream: '#fff8e9',
    paper: '#fbe9ed',
    lavender: '#ead8ed',
    sage: '#a9cfac',
};

const periodLabels: Record<MusicCompatibilityReport['period'], string> = {
    overall: 'All Time',
    '12month': 'Last 12 Months',
    '6month': 'Last 6 Months',
    '3month': 'Last 3 Months',
    '1month': 'Last Month',
    '7day': 'Last 7 Days',
};

function rectangle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    border?: string,
    thickness = 4
) {
    ctx.fillStyle = border ?? fill;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = fill;
    ctx.fillRect(
        x + (border ? thickness : 0),
        y + (border ? thickness : 0),
        width - (border ? thickness * 2 : 0),
        height - (border ? thickness * 2 : 0)
    );
}

function centeredText(
    ctx: CanvasRenderingContext2D,
    original: string,
    x: number,
    y: number,
    maxWidth: number,
    size: number,
    color: string,
    weight: 'normal' | 'bold' = 'bold'
) {
    let fontSize = size;
    let text = original;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const setFont = () => {
        ctx.font = `${weight} ${fontSize}px monospace`;
    };

    setFont();
    while (fontSize > 10 && ctx.measureText(text).width > maxWidth) {
        fontSize -= 1;
        setFont();
    }

    if (ctx.measureText(text).width > maxWidth) {
        while (text.length > 1 && ctx.measureText(`${text}…`).width > maxWidth) {
            text = text.slice(0, -1);
        }
        text += '…';
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function pixelHeart(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pixelSize: number,
    color: string
) {
    const pattern = [
        '01100110',
        '11111111',
        '11111111',
        '01111110',
        '00111100',
        '00011000',
    ];

    ctx.fillStyle = color;
    pattern.forEach((row, rowIndex) => {
        for (let column = 0; column < row.length; column += 1) {
            if (row[column] === '1') {
                ctx.fillRect(
                    x + column * pixelSize,
                    y + rowIndex * pixelSize,
                    pixelSize,
                    pixelSize
                );
            }
        }
    });
}

function pixelListener(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    hair: string,
    shirt: string
) {
    const outline = palette.ink;
    const skin = '#edbdab';

    // Pixel shoes and trousers.
    rectangle(ctx, centerX - 27, 203, 23, 20, '#6d789d', outline, 3);
    rectangle(ctx, centerX + 4, 203, 23, 20, '#6d789d', outline, 3);
    rectangle(ctx, centerX - 31, 221, 27, 7, '#55445e');
    rectangle(ctx, centerX + 4, 221, 27, 7, '#55445e');

    // Sleeves, shirt, and collar.
    rectangle(ctx, centerX - 39, 165, 14, 33, shirt, outline, 3);
    rectangle(ctx, centerX + 25, 165, 14, 33, shirt, outline, 3);
    rectangle(ctx, centerX - 29, 160, 58, 46, shirt, outline, 4);
    rectangle(ctx, centerX - 7, 163, 14, 7, palette.cream);

    // Head, hair, eyes, and cheeks.
    rectangle(ctx, centerX - 26, 117, 52, 47, skin, outline, 4);
    rectangle(ctx, centerX - 28, 112, 56, 15, hair, outline, 3);
    rectangle(ctx, centerX - 27, 124, 8, 22, hair);
    rectangle(ctx, centerX + 19, 124, 8, 22, hair);
    rectangle(ctx, centerX - 13, 141, 5, 5, outline);
    rectangle(ctx, centerX + 9, 141, 5, 5, outline);
    rectangle(ctx, centerX - 20, 150, 8, 4, '#d9949f');
    rectangle(ctx, centerX + 12, 150, 8, 4, '#d9949f');
}

function drawCertificate(
    ctx: CanvasRenderingContext2D,
    report: MusicCompatibilityReport
) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.imageSmoothingEnabled = false;

    // Layered pixel-paper borders.
    rectangle(ctx, 0, 0, WIDTH, HEIGHT, palette.border);
    rectangle(ctx, 8, 8, WIDTH - 16, HEIGHT - 16, palette.paper);
    rectangle(ctx, 16, 16, WIDTH - 32, HEIGHT - 32, palette.cream);
    rectangle(ctx, 23, 23, WIDTH - 46, HEIGHT - 56, palette.cream, '#d7afc2', 2);

    // Decorative corner hearts and pixel confetti.
    pixelHeart(ctx, 36, 35, 3, palette.pink);
    pixelHeart(ctx, 580, 35, 3, palette.pink);
    for (let i = 0; i < 9; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? palette.sage : palette.lavender;
        ctx.fillRect(48 + i * 68, 94, 5, 5);
    }

    centeredText(
        ctx,
        'SCROBBLE CITY  *  MATCHMAKING AGENCY',
        320, 43, 490, 13, palette.berry
    );
    centeredText(
        ctx,
        'OFFICIAL MUSICAL COMPATIBILITY',
        320, 71, 570, 24, palette.ink
    );

    pixelListener(ctx, 160, '#66506e', '#91bda8');
    pixelListener(ctx, 480, '#a0785d', '#b3a0d0');
    pixelHeart(ctx, 296, 154, 6, palette.pink);

    centeredText(ctx, report.firstUsername, 160, 246, 235, 18, palette.ink);
    centeredText(ctx, report.secondUsername, 480, 246, 235, 18, palette.ink);

    rectangle(ctx, 65, 269, 510, 100, palette.paper, '#cba2b8', 4);
    rectangle(ctx, 272, 278, 4, 81, '#dbbdd0');

    const score = Math.min(100, Math.max(0, Math.round(report.score)));
    centeredText(ctx, `${score}%`, 168, 306, 180, 48, palette.berry);
    centeredText(ctx, 'MUSIC SIMILARITY', 168, 347, 180, 12, palette.ink);
    centeredText(ctx, 'OFFICIAL VERDICT', 423, 290, 264, 12, palette.berry);
    centeredText(ctx, report.verdict, 423, 321, 267, 20, palette.ink);
    centeredText(
        ctx,
        `PERIOD: ${periodLabels[report.period]}`,
        423, 351, 267, 12, palette.berry
    );

    centeredText(
        ctx,
        `${report.sharedCount} SHARED TOP-100 ARTISTS`,
        320, 390, 540, 16, palette.ink
    );

    const favorites = report.sharedArtists
        .slice(0, 3)
        .map((artist) => artist.name)
        .join('  +  ');

    centeredText(
        ctx,
        favorites || 'A WHOLE WORLD OF NEW MUSIC TO EXPLORE',
        320, 414, 555, 13, palette.berry, 'normal'
    );

    centeredText(
        ctx,
        'FOR FUN, NOT A SCIENTIFIC RELATIONSHIP TEST  *  SCROBBLE CITY',
        320, 440, 575, 11, palette.ink, 'normal'
    );
}

export default function CompatibilityCertificate({
    report,
}: CompatibilityCertificateProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [downloadError, setDownloadError] = useState('');

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (context) drawCertificate(context, report);
    }, [report]);

    function downloadPNG() {
        const source = canvasRef.current;
        if (!source) return;

        try {
            // Scale with smoothing disabled to preserve sharp pixel edges.
            const output = document.createElement('canvas');
            output.width = WIDTH * 2;
            output.height = HEIGHT * 2;
            const context = output.getContext('2d');
            if (!context) throw new Error('Canvas export is unavailable.');

            context.imageSmoothingEnabled = false;
            context.drawImage(source, 0, 0, output.width, output.height);

            const safeName = (name: string) =>
                name.replace(/[^a-z0-9_-]/gi, '-').slice(0, 50) || 'listener';

            const link = document.createElement('a');
            link.href = output.toDataURL('image/png');
            link.download =
                `scrobble-city-${safeName(report.firstUsername)}-` +
                `${safeName(report.secondUsername)}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setDownloadError('');
        } catch (error) {
            console.error('Certificate export failed:', error);
            setDownloadError('Could not create the PNG. Please try another browser.');
        }
    }

    return (
        <section className="compat-certificate">
            <div className="compat-certificate-heading">
                <span>💌 THE MATCHMAKING AGENCY PRESENTS</span>
                <h4>Your Official Compatibility Certificate</h4>
                <p>Preview your pixel-art keepsake, then save it as an image.</p>
            </div>

            <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                role="img"
                aria-label={`Pixel-art music compatibility certificate for ${report.firstUsername} and ${report.secondUsername}: ${report.score}% similarity, ${report.verdict}`}
            >
                Your browser does not support the certificate preview.
            </canvas>

            <button
                type="button"
                className="compat-certificate-download"
                onClick={downloadPNG}
            >
                🖼️ DOWNLOAD CERTIFICATE AS PNG
            </button>

            {downloadError && (
                <p className="compat-certificate-error" role="alert">
                    {downloadError}
                </p>
            )}
            <p className="compat-certificate-note">
                Exports at 1280 × 920 pixels. No extra libraries or image files required.
            </p>
        </section>
    );
}
