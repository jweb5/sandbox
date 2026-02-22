"""
Generate simple PNG icons for the Claude Grammar Checker extension.
Uses only Python stdlib (struct, zlib, io) — no external dependencies.
Draws a purple circle with a white "✦" sparkle symbol.
"""

import struct
import zlib
import io


def make_png(size: int) -> bytes:
    """Create a size×size RGBA PNG with a purple gradient circle and white sparkle."""
    half = size / 2
    radius = half * 0.9

    # Build raw RGBA pixel data
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            dx = x - half + 0.5
            dy = y - half + 0.5
            dist = (dx * dx + dy * dy) ** 0.5

            if dist <= radius:
                # Purple-to-indigo gradient fill
                t = dist / radius  # 0 centre → 1 edge
                r = int(124 + (79 - 124) * t)    # 7c → 4f
                g = int(58 + (70 - 58) * t)      # 3a → 46
                b = int(237 + (229 - 237) * t)   # ed → e5
                a = 255

                # Draw a minimal "✦" sparkle as 4 diamond lobes
                ax, ay = abs(dx), abs(dy)
                lobe_w = radius * 0.22
                lobe_h = radius * 0.55
                # Vertical bar
                in_v = ax < lobe_w and ay < lobe_h
                # Horizontal bar
                in_h = ay < lobe_w and ax < lobe_h
                # 45° bars (thinner)
                diag_w = lobe_w * 0.6
                diag_h = lobe_h * 0.45
                rot1 = abs(dx + dy) / (2 ** 0.5)
                rot2 = abs(dx - dy) / (2 ** 0.5)
                in_d = (rot1 < diag_w and rot2 < diag_h) or (rot2 < diag_w and rot1 < diag_h)

                if in_v or in_h or in_d:
                    r, g, b, a = 255, 255, 255, 255
            else:
                # Transparent outside circle
                r, g, b, a = 0, 0, 0, 0

            row += bytes([r, g, b, a])
        rows.append(bytes(row))

    # Encode as PNG
    buf = io.BytesIO()

    def write_chunk(chunk_type: bytes, data: bytes):
        buf.write(struct.pack('>I', len(data)))
        buf.write(chunk_type)
        buf.write(data)
        crc = zlib.crc32(chunk_type + data) & 0xFFFFFFFF
        buf.write(struct.pack('>I', crc))

    # PNG signature
    buf.write(b'\x89PNG\r\n\x1a\n')

    # IHDR
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    write_chunk(b'IHDR', ihdr)

    # IDAT (filtered rows: prepend 0-filter byte per row, then deflate)
    raw = b''.join(b'\x00' + row for row in rows)
    write_chunk(b'IDAT', zlib.compress(raw, 9))

    # IEND
    write_chunk(b'IEND', b'')

    return buf.getvalue()


if __name__ == '__main__':
    import os
    out_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(out_dir, exist_ok=True)
    for size in (16, 32, 48, 128):
        path = os.path.join(out_dir, f'icon{size}.png')
        with open(path, 'wb') as f:
            f.write(make_png(size))
        print(f'Created {path}')
