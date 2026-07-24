"""창업메이트 카카오 채널 프로필 로고 640x640 생성.

사이트 브랜딩(파란 라운드 사각 + 흰 K)과 통일. 고해상도(4x)로 그린 뒤 축소해 안티앨리어싱.
"""
from PIL import Image, ImageDraw, ImageFont

S = 640
SS = 4  # supersample
W = S * SS

img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 배경: 파란색 세로 그라디언트 (사이트 --blue #2563eb → 조금 짙게)
top = (37, 99, 235)      # #2563eb
bot = (29, 78, 216)      # #1d4ed8
bg = Image.new("RGB", (1, W))
for y in range(W):
    t = y / W
    bg.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
bg = bg.resize((W, W))

# 라운드 사각 마스크 (모서리 반경 ~22%)
mask = Image.new("L", (W, W), 0)
md = ImageDraw.Draw(mask)
radius = int(W * 0.235)
md.rounded_rectangle([0, 0, W - 1, W - 1], radius=radius, fill=255)

canvas = Image.new("RGBA", (W, W), (0, 0, 0, 0))
canvas.paste(bg, (0, 0), mask)

d = ImageDraw.Draw(canvas)

# 중앙에 흰 'K' — 굵은 폰트
font = ImageFont.truetype("C:/Windows/Fonts/seguibl.ttf", int(W * 0.62))
tb = d.textbbox((0, 0), "K", font=font)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
tx = (W - tw) / 2 - tb[0]
ty = (W - th) / 2 - tb[1] - int(W * 0.01)
d.text((tx, ty), "K", font=font, fill=(255, 255, 255, 255))

# 우하단 실시간 도트 악센트 (초록) — 서비스 정체성
dot_r = int(W * 0.055)
cx, cy = int(W * 0.735), int(W * 0.735)
d.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=(16, 185, 129, 255))

out = canvas.resize((S, S), Image.LANCZOS)
out.save("item-matcher/public/kakao-logo.png")

# 흰 배경 버전(카카오는 투명 배경 프로필도 되지만, 혹시 몰라 불투명 버전도)
white = Image.new("RGBA", (S, S), (255, 255, 255, 255))
white.alpha_composite(out)
white.convert("RGB").save("item-matcher/public/kakao-logo-white.png")
print("saved kakao-logo.png (640x640)")
