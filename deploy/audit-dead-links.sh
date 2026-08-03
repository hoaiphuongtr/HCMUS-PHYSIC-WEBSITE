#!/bin/sh
# Kiem link noi bo — THEO redirect (-L) va lay ma cuoi cung. Ban truoc coi 307 la
# song, nhung /mon-hoc/... tra 307 (them tien to /vi) roi moi 404 o dich, nen bao
# cao thieu ca ho noi dung 407 mon hoc.
set -u
: > /tmp/dead3.txt
n=0; tot=$(wc -l < /tmp/paths2.txt)
while IFS= read -r p; do
  n=$((n+1))
  c=$(curl -sL -o /dev/null -m 30 -w '%{http_code}' "http://localhost:3002/vi$p" 2>/dev/null)
  case "$c" in 2*) continue;; esac
  c2=$(curl -sL -o /dev/null -m 30 -w '%{http_code}' "http://localhost:3002$p" 2>/dev/null)
  case "$c2" in 2*) continue;; esac
  echo "$c $p" >> /tmp/dead3.txt
  [ $((n % 150)) -eq 0 ] && echo "  ... $n/$tot chet=$(wc -l < /tmp/dead3.txt)"
done < /tmp/paths2.txt
echo "TONG=$tot CHET=$(wc -l < /tmp/dead3.txt)"
echo "=== nhom theo ho noi dung ==="
cut -d' ' -f2- /tmp/dead3.txt | sed 's#^/##' | awk -F/ '{if (NF>1) print $1"/…"; else print "(goc) "$1}' | sort | uniq -c | sort -rn | head -15
