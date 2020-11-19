package main

import (
	"bytes"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/boltdb/bolt"
)

const emptyComment = "<!--  -->"

const eoln = "\r\n"

func flush(db *bolt.DB, buf *bytes.Buffer, dateString string) {
	db.Update(func(tx *bolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("notes"))
		if err != nil {
			panic(err)
		}
		b.Put([]byte(dateString), buf.Bytes())
		return nil
	})
	buf.Reset()
}

func update(db *bolt.DB, content string) {
	lines := strings.Split(content, eoln)
	dateString := ""
	var buf bytes.Buffer
	for _, line := range lines {
		if line == emptyComment {
			buf.WriteString(eoln)
			break
		}
		if strings.HasPrefix(line, "# ") {
			if dateString != "" {
				flush(db, &buf, dateString)
			}
			lst := strings.Split(line[2:], "-")
			if len(lst) != 3 {
				panic(errors.New("invalid date " + line[2:]))
			}
			year, err := strconv.Atoi(lst[0])
			if err != nil {
				panic(err)
			}
			month, err := strconv.Atoi(lst[1])
			if err != nil {
				panic(err)
			}
			day, err := strconv.Atoi(lst[2])
			if err != nil {
				panic(err)
			}
			dateString = fmt.Sprintf("%d-%02d-%02d", year, month, day)
		} else {
			buf.WriteString(line)
			buf.WriteString(eoln)
		}
	}
	flush(db, &buf, dateString)
}
func keys(db *bolt.DB) [][]byte {
	var result [][]byte
	db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("notes"))
		cursor := b.Cursor()
		for key, _ := cursor.First(); key != nil; key, _ = cursor.Next() {
			keyCloned := make([]byte, len(key))
			copy(keyCloned, key)
			result = append(result, keyCloned)
		}
		return nil
	})
	return result
}
func generate(db *bolt.DB, keys [][]byte) []byte {
	var buf bytes.Buffer
	L := len(keys)
	for index, key := range keys {
		db.View(func(tx *bolt.Tx) error {
			b := tx.Bucket([]byte("notes"))
			buf.WriteString("# ")
			buf.Write(key)
			buf.WriteString(eoln)
			content := b.Get(key)
			if index == L-1 {
				content = content[:len(content)-len(eoln)]
			}
			buf.Write(content)
			return nil
		})
	}
	buf.WriteString(emptyComment)
	return buf.Bytes()
}
