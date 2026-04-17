"""Quick brace/string balance check for inline JS. Not full parser, but
catches basic issues like unterminated strings or unmatched braces."""
import re, sys

html = open('revenue.html', encoding='utf-8').read()
m = re.search(r'<script(?![^>]*src=)[^>]*>', html)
s_start = m.end()
s_end = html.index('</script>', s_start)
js = html[s_start:s_end]

i = 0
n = len(js)
depth_brace = depth_paren = depth_brack = 0
mx_brace = 0
in_str = None
while i < n:
    c = js[i]
    nxt = js[i + 1] if i + 1 < n else ''
    if in_str:
        if c == chr(92):
            i += 2
            continue
        if c == in_str:
            in_str = None
        i += 1
        continue
    if c == '/' and nxt == '/':
        while i < n and js[i] != '\n':
            i += 1
        continue
    if c == '/' and nxt == '*':
        i += 2
        while i < n - 1 and not (js[i] == '*' and js[i + 1] == '/'):
            i += 1
        i += 2
        continue
    if c in ('"', "'", '`'):
        in_str = c
        i += 1
        continue
    if c == '{':
        depth_brace += 1
        mx_brace = max(mx_brace, depth_brace)
    elif c == '}':
        depth_brace -= 1
    elif c == '(':
        depth_paren += 1
    elif c == ')':
        depth_paren -= 1
    elif c == '[':
        depth_brack += 1
    elif c == ']':
        depth_brack -= 1
    i += 1

ok = (depth_brace == 0 and depth_paren == 0 and depth_brack == 0 and in_str is None)
print(f"braces={depth_brace} parens={depth_paren} brackets={depth_brack} in_str={in_str} max_depth={mx_brace}")
sys.exit(0 if ok else 1)
