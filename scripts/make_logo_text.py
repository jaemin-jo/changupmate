"""창업메이트 채널 로고 — CHANGUP / MATE 2줄 (색감 유지: 파란 라운드 사각 + 흰 텍스트)."""
from PIL import Image, ImageDraw, ImageFont

S = 640
SS = 4
W = S * SS


def rounded_blue_bg():
    top, bot = (37, 99, 235), (29, 78, 216)
    bg = Image.new("RGB", (1, W))
    for y in range(W):
        t = y / W
        bg.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    bg = bg.resize((W, W))
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * 0.235), fill=255)
    c = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    c.paste(bg, (0, 0), mask)
    return c


def font_bl(px):
    return ImageFont.truetype("C:/Windows/Fonts/seguibl.ttf", int(px))  # Segoe UI Black


def centered(d, cx, y, txt, f, fill):
    tb = d.textbbox((0, 0), txt, font=f)
    d.text((cx - (tb[2] - tb[0]) / 2 - tb[0], y - tb[1]), txt, font=f, fill=fill)


# ── 시안 D: CHANGUP / MATE 2줄 ──
img = rounded_blue_bg()
d = ImageDraw.Draw(img)
cx = W / 2
f = font_bl(int(W * 0.185))
# 자간 살짝 넓힌 느낌을 위해 큰 사이즈로 두 줄
centered(d, cx, int(W * 0.315), "CHANGUP", f, (255, 255, 255, 255))
# 가운데 초록 구분선(악센트)
d.rounded_rectangle(
    [int(W * 0.40), int(W * 0.505), int(W * 0.60), int(W * 0.527)],
    radius=int(W * 0.011), fill=(16, 185, 129, 255),
)
centered(d, cx, int(W * 0.575), "MATE", f, (255, 255, 255, 255))
img.resize((S, S), Image.LANCZOS).save("item-matcher/public/kakao-logo-d.png")

# ── 시안 E: CHANGUP / MATE — 초록선 대신 슬래시(/) 느낌 없이 깔끔, MATE를 초록 강조 ──
img2 = rounded_blue_bg()
d2 = ImageDraw.Draw(img2)
centered(d2, cx, int(W * 0.34), "CHANGUP", font_bl(int(W * 0.175)), (255, 255, 255, 255))
centered(d2, cx, int(W * 0.545), "MATE", font_bl(int(W * 0.205)), (110, 231, 183, 255))  # 민트 강조
img2.resize((S, S), Image.LANCZOS).save("item-matcher/public/kakao-logo-e.png")

print("saved kakao-logo-d.png, kakao-logo-e.png")
