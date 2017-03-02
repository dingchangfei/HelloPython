from PIL import Image

im = Image.open("temp\captcha (1).gif")

print(im.size)

width = im.size[0]
height = im.size[1]

count = 0
for w in range(0, width):
    sum = 0
    for h in range(0, height):
        pixel = im.getpixel((w, h))
        sum+=pixel
        # if int(pixel) > 0:
        #     print(pixel)
    #print('%s:%s'%(w,sum))
    print('%s' % (sum))

