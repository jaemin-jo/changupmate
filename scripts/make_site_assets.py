"""D 로고 기반 사이트 에셋 생성: 파비콘 세트 + OG 공유 썸네일(1200x630)."""
from PIL import Image, ImageDraw, ImageFont

SS = 4
BLUE_TOP, BLUE_BOT = (37, 99, 235), (29, 78, 216)
GREEN = (16, 185, 129)


def blue_grad(w, h):
    bg = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / h
        bg.putpixel((0, y), tuple(int(BLUE_TOP[i] + (BLUE_BOT[i] - BLUE_TOP[i]) * t) for i in range(3)))
    return bg.resize((w, h))


def font_bl(px):
    return ImageFont.truetype("C:/Windows/Fonts/seguibl.ttf", int(px))


def font_kr(px):
    return ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", int(px))


def ctext(d, cx, y, txt, f, fill):
    tb = d.textbbox((0, 0), txt, font=f)
    d.text((cx - (tb[2] - tb[0]) / 2 - tb[0], y - tb[1]), txt, font=f, fill=fill)


def make_icon(size):
    """D 로고(CHANGUP/MATE) 정사각 아이콘."""
    W = size * SS
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    bg = blue_grad(W, W)
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * 0.235), fill=255)
    img.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(img)
    cx = W / 2
    # 작은 파비콘(<=64)은 텍스트가 뭉개지므로 'CM' 축약, 크면 풀 2줄
    if size <= 64:
        ctext(d, cx, int(W * 0.30), "CM", font_bl(int(W * 0.40)), (255, 255, 255, 255))
        d.rounded_rectangle(
            [int(W * 0.36), int(W * 0.70), int(W * 0.64), int(W * 0.745)],
            radius=int(W * 0.02), fill=GREEN,
        )
    else:
        f = font_bl(int(W * 0.185))
        ctext(d, cx, int(W * 0.315), "CHANGUP", f, (255, 255, 255, 255))
        d.rounded_rectangle(
            [int(W * 0.40), int(W * 0.505), int(W * 0.60), int(W * 0.527)],
            radius=int(W * 0.011), fill=GREEN,
        )
        ctext(d, cx, int(W * 0.575), "MATE", f, (255, 255, 255, 255))
    return img.resize((size, size), Image.LANCZOS)


# 파비콘 세트
for sz in (32, 48, 180, 192, 512):
    make_icon(sz).save(f"item-matcher/public/icon-{sz}.png")
make_icon(48).save("item-matcher/public/favicon.png")

# OG 공유 썸네일 1200x630
OW, OH = 1200 * SS, 630 * SS
og = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
og.paste(blue_grad(OW, OH), (0, 0))
d = ImageDraw.Draw(og)
# 왼쪽: D 아이콘
icon = make_icon(360).resize((360 * SS // 1, 360 * SS // 1), Image.LANCZOS)
og.alpha_composite(icon, (int(OW * 0.09), (OH - icon.height) // 2))
# 오른쪽: 서비스명 + 태그라인
tx = int(OW * 0.40)
d.text((tx, int(OH * 0.30)), "창업메이트", font=font_kr(int(OH * 0.16)), fill=(255, 255, 255, 255))
d.rounded_rectangle(
    [tx + 4, int(OH * 0.50), tx + int(OW * 0.10), int(OH * 0.515)], radius=8, fill=GREEN
)
d.text((tx, int(OH * 0.55)), "실시간 사업지원공고 매칭", font=font_kr(int(OH * 0.075)),
       fill=(226, 232, 255, 255))
og.resize((1200, 630), Image.LANCZOS).convert("RGB").save("item-matcher/public/og-image.png")

print("saved favicon set + og-image.png")
