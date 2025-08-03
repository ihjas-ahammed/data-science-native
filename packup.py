import os
import fnmatch
import argparse

# --- Configuration ---
DEFAULT_OUTPUT_FILENAME = "project_snapshot_out.txt"
# Common binary file extensions to skip by default (can be overridden)
# A more robust check would be to try decoding and catch errors.
DEFAULT_BINARY_EXTENSIONS = {
    '.py','.txt',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.ico',  # Images
    '.mp3', '.wav', '.ogg', '.flac',                           # Audio
    '.mp4', '.avi', '.mov', '.mkv', '.webm',                   # Video
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', # Documents (often binary)
    '.zip', '.tar', '.gz', '.rar', '.7z',                      # Archives
    '.exe', '.dll', '.so', '.dylib', '.app',                   # Executables/Libraries
    '.pyc', '.pyo',                                           # Python compiled
    '.o', '.a', '.obj', '.lib',                                # Object/static lib
    '.class',                                                 # Java compiled
    '.db', '.sqlite', '.sqlite3',                             # Databases
    '.woff', '.woff2', '.ttf', '.otf', '.eot',                 # Fonts
    '.DS_Store','.md','.txt','.json','.sh','public'# macOS specific
}
# Additional patterns to always ignore, even if not in .gitignore
# These are matched against relative paths from the root_dir
ADDITIONAL_IGNORE_PATTERNS = [
    ".git/",  # Entire .git directory
    ".vscode/",
    ".idea/",
    "__pycache__/",
    "*.pyc",
    "*.pyo",
    ".DS_Store",
    # The script might add its own output file here if run multiple times
]

def load_gitignore_patterns(root_dir):
    """Loads patterns from .gitignore file in the root directory."""
    gitignore_path = os.path.join(root_dir, ".gitignore")
    patterns = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    patterns.append(line)
    return patterns

def should_ignore(path_relative_to_root, gitignore_patterns, additional_patterns, is_dir=False):
    """
    Checks if a given path (relative to project root) should be ignored.
    Uses .gitignore style matching.
    """
    # Normalize path for consistent matching
    path_to_check = path_relative_to_root.replace(os.sep, "/")
    if is_dir and not path_to_check.endswith("/"):
        path_to_check_for_dir_pattern = path_to_check + "/"
    else:
        path_to_check_for_dir_pattern = path_to_check


    all_patterns = gitignore_patterns + additional_patterns

    for pattern in all_patterns:
        is_negative = False
        if pattern.startswith("!"):
            is_negative = True
            pattern = pattern[1:]

        # Handle directory-specific patterns (ending with /)
        if pattern.endswith("/"):
            # This pattern specifically targets directories
            if is_dir and fnmatch.fnmatch(path_to_check_for_dir_pattern, pattern):
                return not is_negative # If negative pattern matches, don't ignore
            # If it's a file, it can't match a dir-only pattern unless pattern is like `dir/*`
            # A simple dir pattern like `build/` should ignore `build/file.txt`
            if fnmatch.fnmatch(path_to_check_for_dir_pattern, pattern + "*"): # Match if path is *within* this dir pattern
                 return not is_negative
        # Handle general patterns (files or directories if no trailing /)
        elif fnmatch.fnmatch(path_to_check, pattern):
            return not is_negative
        # If pattern is `node_modules` and path is `node_modules/somefile.js`
        elif not pattern.startswith("/") and not pattern.endswith("/") and \
             fnmatch.fnmatch(os.path.basename(path_to_check), pattern):
             return not is_negative
        # Match if path is within a directory pattern that doesn't end with /
        # e.g. pattern `build` should ignore `build/file.txt`
        if is_dir and fnmatch.fnmatch(path_to_check, pattern): # `build` matches `build`
             return not is_negative
        if not is_dir and fnmatch.fnmatch(os.path.dirname(path_to_check_for_dir_pattern), pattern): # `build` matches `build/` for file `build/foo.txt`
             return not is_negative


    return False # If no pattern matched, don't ignore (unless a negative pattern made us return False earlier)

def is_likely_binary_file(filepath, binary_extensions):
    """Checks if a file is likely binary based on its extension or content."""
    _, ext = os.path.splitext(filepath)
    if ext.lower() in binary_extensions:
        return True
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            f.read(1024)  # Try to read a chunk
        return False
    except UnicodeDecodeError:
        return True
    except Exception: # Other read errors
        return True # Assume binary or problematic
    return False


def pack_project(root_dir, output_filename, binary_extensions, additional_ignores):
    """Packs all relevant files into a single text file."""
    gitignore_patterns = load_gitignore_patterns(root_dir)
    all_packed_content = []
    output_filepath_abs = os.path.abspath(os.path.join(root_dir, output_filename))

    # Add the output file itself to dynamic additional ignores to prevent packing itself
    dynamic_additional_ignores = list(additional_ignores) # Make a mutable copy
    dynamic_additional_ignores.append(output_filename) # Relative to root_dir for matching

    files_packed_count = 0
    files_ignored_count = 0
    dirs_ignored_count = 0

    print(f"Starting project pack-up from: {os.path.abspath(root_dir)}")
    print(f"Output will be: {output_filepath_abs}")

    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
        # Modify dirnames in-place to prevent os.walk from descending into ignored dirs
        original_dirnames_count = len(dirnames)
        dirs_to_remove = []
        for dname in dirnames:
            current_dir_abs = os.path.join(dirpath, dname)
            current_dir_rel = os.path.relpath(current_dir_abs, root_dir)
            if should_ignore(current_dir_rel, gitignore_patterns, dynamic_additional_ignores, is_dir=True):
                dirs_to_remove.append(dname)
        
        for dname_to_remove in dirs_to_remove:
            dirnames.remove(dname_to_remove)
            print(f"  Ignoring directory: {os.path.join(os.path.relpath(dirpath, root_dir), dname_to_remove)}")
            dirs_ignored_count +=1

        for filename in filenames:
            filepath_abs = os.path.join(dirpath, filename)
            filepath_rel = os.path.relpath(filepath_abs, root_dir)

            if filepath_abs == output_filepath_abs: # Skip the output file itself
                continue

            if should_ignore(filepath_rel, gitignore_patterns, dynamic_additional_ignores, is_dir=False):
                print(f"  Ignoring file (rule): {filepath_rel}")
                files_ignored_count += 1
                continue

            if is_likely_binary_file(filepath_abs, binary_extensions):
                print(f"  Ignoring file (binary): {filepath_rel}")
                files_ignored_count += 1
                continue

            try:
                with open(filepath_abs, "r", encoding="utf-8", errors="replace") as f_in:
                    content = f_in.read()
                
                # Use OS-agnostic forward slashes for paths in the output
                header_path = filepath_rel.replace(os.sep, "/")
                all_packed_content.append(f"--- START OF FILE {header_path} ---")
                all_packed_content.append(content)
                all_packed_content.append(f"--- END OF FILE {header_path} ---\n")
                print(f"  Packing file: {filepath_rel}")
                files_packed_count += 1
            except Exception as e:
                print(f"  Error reading file {filepath_rel}: {e}")
                all_packed_content.append(f"--- START OF FILE {filepath_rel.replace(os.sep, '/')} ---")
                all_packed_content.append(f"[Error reading file: {e}]")
                all_packed_content.append(f"--- END OF FILE {filepath_rel.replace(os.sep, '/')} ---\n")
                files_ignored_count +=1 # Count as ignored due to error

    try:
        with open(output_filepath_abs, "w", encoding="utf-8") as f_out:
            f_out.write("\n".join(all_packed_content))
        print(f"\nSuccessfully packed project into: {output_filepath_abs}")
        print(f"  Files packed: {files_packed_count}")
        print(f"  Files ignored/skipped: {files_ignored_count}")
        print(f"  Directories ignored: {dirs_ignored_count}")

    except Exception as e:
        print(f"\nError writing output file {output_filepath_abs}: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pack project files into a single text file, respecting .gitignore.")
    parser.add_argument("root_dir", nargs="?", default=".",
                        help="The root directory of the project to pack (default: current directory).")
    parser.add_argument("-o", "--output", default=DEFAULT_OUTPUT_FILENAME,
                        help=f"The name of the output file (default: {DEFAULT_OUTPUT_FILENAME}). Will be created in the root_dir.")
    parser.add_argument("--skip-binary-exts", nargs="*", default=None,
                        help="Space-separated list of binary extensions to skip (e.g., .png .jpg). Overrides default list if provided. Use 'none' for no extension-based skipping.")
    
    args = parser.parse_args()

    # Determine binary extensions to use
    if args.skip_binary_exts is None: # Use default
        binary_extensions_to_use = DEFAULT_BINARY_EXTENSIONS
    elif args.skip_binary_exts == ['none']: # User wants no extension based skipping
        binary_extensions_to_use = set()
    else: # User provided custom list
        binary_extensions_to_use = {ext.lower() if ext.startswith('.') else '.' + ext.lower() for ext in args.skip_binary_exts}


    pack_project(args.root_dir, args.output, binary_extensions_to_use, ADDITIONAL_IGNORE_PATTERNS)