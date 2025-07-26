#!/usr/bin/env python3
import sys
import os
from rembg import remove
from PIL import Image
import io

def remove_background(input_path, output_path):
    """
    Remove background from image using rembg
    """
    try:
        # Read input image
        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()
        
        # Remove background
        output_data = remove(input_data)
        
        # Save output image
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
        
        print(f"✅ Background removed successfully: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error removing background: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input_path> <output_path>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"❌ Input file does not exist: {input_path}")
        sys.exit(1)
    
    success = remove_background(input_path, output_path)
    sys.exit(0 if success else 1)