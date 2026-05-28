import shutil

src_before = r"C:\Users\saikr\.gemini\antigravity-ide\brain\26588d5b-180b-4bbf-b6a8-fac4e37347b3\teeth_crooked_before_1779956078684.png"
src_after = r"C:\Users\saikr\.gemini\antigravity-ide\brain\26588d5b-180b-4bbf-b6a8-fac4e37347b3\teeth_straight_after_1779956128001.png"

dest_before = r"c:\Users\saikr\Downloads\hollydental-platform-main\hollydental-platform-main\client\public\teeth-before.png"
dest_after = r"c:\Users\saikr\Downloads\hollydental-platform-main\hollydental-platform-main\client\public\teeth-after.png"

try:
    shutil.copy(src_before, dest_before)
    print("Success before")
    shutil.copy(src_after, dest_after)
    print("Success after")
except Exception as e:
    print("Error:", e)
