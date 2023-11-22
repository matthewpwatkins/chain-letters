bash update-version-number.sh
last_file=$(ls -1v public/puzzle-definitions | tail -1)
puzzle_count=$(echo "$last_file" | sed 's/^0*//' | cut -f 1 -d '.')
REACT_APP_PUZZLE_COUNT=$puzzle_count npm run build