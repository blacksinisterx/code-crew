"""Turn the recorded playthrough into a GIF and an MP4.  Usage: python scripts/compose.py   (needs: pip install imageio-ffmpeg)"""
import os
import subprocess
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC, OUT = '../docs/media/raw/play.webm', '../docs/media/'
mp4 = OUT + 'code-crew-demo.mp4'
subprocess.run([FF, '-y', '-i', SRC, '-vf', 'scale=1000:-2', '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', mp4],
               check=True, capture_output=True)
gif = OUT + 'code-crew-demo.gif'
for fps, w, colors in [(12, 880, 96), (10, 800, 64), (8, 720, 48)]:
    graph = (f'fps={fps},scale={w}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors={colors}:stats_mode=diff[p];'
             '[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle')
    subprocess.run([FF, '-y', '-i', SRC, '-vf', graph, '-loop', '0', gif], check=True, capture_output=True)
    size = os.path.getsize(gif)
    print(f'gif {fps}fps {w}px {colors}c = {size / 1e6:.2f} MB')
    if size <= 4.6e6:
        break
print(f'mp4 = {os.path.getsize(mp4) / 1e6:.2f} MB')
