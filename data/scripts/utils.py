from PIL import Image, ImageDraw

def create_rounded_image(image_path):
    """
    将PNG图片转换为圆角矩形
    
    Args:
        image_path: 图片路径
        radius: 圆角半径，默认30像素
    
    Returns:
        处理后的PIL Image对象
    """
    # 打开原始图片
    img = Image.open(image_path)
    
    # 创建一个相同大小的蒙版
    mask = Image.new('L', img.size, 0)
    draw = ImageDraw.Draw(mask)
    
    # 绘制圆角矩形蒙版
    width, height = img.size
    radius = int(width * 0.23)
    draw.rounded_rectangle([(0, 0), (width, height)], radius, fill=255)
    
    # 创建新的输出图像
    output = Image.new('RGBA', img.size, (0, 0, 0, 0))
    
    # 将原图与蒙版合并
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    return output

if __name__ == '__main__':
    # 使用示例：
    img = create_rounded_image('data/icon_panda.JPG')
    img.save('data/icon_panda_rc.png')