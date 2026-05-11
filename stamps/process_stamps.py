import os
import sys
from PIL import Image

def color_distance(c1, c2):
    return ((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2) ** 0.5

def remove_background(img, tolerance=60):
    w, h = img.size
    pixels = img.load()
    
    corners = [
        pixels[2, 2],
        pixels[w-3, 2],
        pixels[2, h-3],
        pixels[w-3, h-3],
    ]
    bg_color = corners[0][:3]
    
    visited = set()
    queue = []
    
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h-1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w-1, y))
        
    bg_pixels = set()
    
    while queue:
        x, y = queue.pop()
        if (x, y) in visited:
            continue
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        visited.add((x, y))
        
        px = pixels[x, y]
        dist = color_distance(px[:3], bg_color)
        
        if dist <= tolerance:
            bg_pixels.add((x, y))
            for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                nx, ny = x+dx, y+dy
                if (nx, ny) not in visited:
                    queue.append((nx, ny))
                    
    for (x, y) in bg_pixels:
        pixels[x, y] = (0, 0, 0, 0)
        
    return img

def process_image(input_path, output_path, size=64):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    
    # Remove background
    img = remove_background(img, tolerance=70)
    
    # Resize
    img_out = img.resize((size, size), Image.LANCZOS)
    img_out.save(output_path, "PNG")
    print(f"Saved to {output_path}")

def process_directory(raw_dir, out_dir):
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        
    for filename in os.listdir(raw_dir):
        if filename.endswith(".png") or filename.endswith(".webp") or filename.endswith(".jpg"):
            in_path = os.path.join(raw_dir, filename)
            out_filename = os.path.splitext(filename)[0] + ".png"
            out_path = os.path.join(out_dir, out_filename)
            try:
                process_image(in_path, out_path)
            except Exception as e:
                print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_stamps.py <raw_dir> <out_dir>")
        sys.exit(1)
    process_directory(sys.argv[1], sys.argv[2])
