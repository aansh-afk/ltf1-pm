package output

import (
	"encoding/json"
	"fmt"
	"os"
)

// JSON prints the value as pretty JSON to stdout.
func JSON(value any) error {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(value)
}

// JSONString returns the value as a pretty JSON string.
func JSONString(value any) string {
	b, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return fmt.Sprintf("error: %v", err)
	}
	return string(b)
}
