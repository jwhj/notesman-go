package main

import (
	"errors"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/boltdb/bolt"
)

const tmpFile = "tmp.md"
const gitDir = "notes"

func main() {
	db, err := bolt.Open("notes.db", 0600, nil)
	if err != nil {
		panic(err)
	}
	if len(os.Args) <= 1 {
		panic(errors.New("missing subcommand"))
	}
	switch os.Args[1] {
	case "gen":
		os.Mkdir("notes", os.ModePerm)
		cmd := exec.Command("git", "init")
		cmd.Dir = "notes"
		cmd.Run()
		buf, err := ioutil.ReadFile("notes.md")
		if err != nil {
			panic(err)
		}
		update(db, string(buf))
	case "watch":
		if len(os.Args) > 2 {
			keys := keys(db)
			n, err := strconv.Atoi(os.Args[2])
			if err != nil {
				panic(err)
			}
			ioutil.WriteFile(tmpFile, generate(db, keys[len(keys)-n:]), 0600)
		} else {
			ioutil.WriteFile(tmpFile, generate(db, keys(db)), 0600)
		}
		done := make(chan struct{})
		go func() {
			signals := make(chan os.Signal)
			signal.Notify(signals, syscall.SIGINT)
			<-signals
			log.Println("SIGINT received")
			done <- struct{}{}
		}()
		watch(db, done)
	case "ui":
		serve(db)
	}
}
