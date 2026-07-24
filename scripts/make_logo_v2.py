"""창업메이트 카카오 채널 로고 시안 B, C 생성."""
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


def font(px):
    return ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", int(px))


def font_bl(px):
    return ImageFont.truetype("C:/Windows/Fonts/seguibl.ttf", int(px))


def centered(d, cx, y, txt, f, fill):
    tb = d.textbbox((0, 0), txt, font=f)
    d.text((cx - (tb[2] - tb[0]) / 2 - tb[0], y), txt, font=f, fill=fill)


# ── 시안 B: K 심볼 + '창업메이트' 텍스트 ──
b = rounded_blue_bg()
d = ImageDraw.Draw(b)
centered(d, W / 2, int(W * 0.20), "K", font_bl(int(W * 0.42)), (255, 255, 255, 255))
# 밑줄 악센트
d.rounded_rectangle(
    [int(W * 0.40), int(W * 0.605), int(W * 0.60), int(W * 0.625)],
    radius=int(W * 0.01), fill=(16, 185, 129, 255),
)
centered(d, W / 2, int(W * 0.66), "창업메이트", font(int(W * 0.135)), (255, 255, 255, 255))
b.resize((S, S), Image.LANCZOS).save("item-matcher/public/kakao-logo-b.png")

# ── 시안 C: 말풍선 + 번개(실시간 매칭) 심볼 ──
c = rounded_blue_bg()
d = ImageDraw.Draw(c)
# 흰 말풍선
bx0, by0, bx1, by1 = int(W * 0.22), int(W * 0.24), int(W * 0.78), int(W * 0.64)
d.rounded_rectangle([bx0, by0, bx1, by1], radius=int(W * 0.09), fill=(255, 255, 255, 255))
# 말풍선 꼬리
d.polygon(
    [(int(W * 0.36), by1 - 2), (int(W * 0.30), int(W * 0.75)), (int(W * 0.50), by1 - 2)],
    fill=(255, 255, 255, 255),
)
# 번개 (파란색) 중앙
cx = W / 2
lightning = [
    (cx + W * 0.03, by0 + W * 0.06),
    (cx - W * 0.09, by0 + W * 0.22),
    (cx - W * 0.01, by0 + W * 0.22),
    (cx - W * 0.04, by0 + W * 0.34),
    (cx + W * 0.10, by0 + W * 0.16),
    (cx + W * 0.01, by0 + W * 0.16),
]
d.polygon(lightning, fill=(37, 99, 235, 255))
c.resize((S, S), Image.LANCZOS).save("item-matcher/public/kakao-logo-c.png")

print("saved kakao-logo-b.png, kakao-logo-c.png")
