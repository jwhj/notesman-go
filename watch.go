package main

import (
	"context"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/boltdb/bolt"
	"github.com/fsnotify/fsnotify"
)

func watch(db *bolt.DB, ctx context.Context) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		panic(err)
	}
	defer watcher.Close()
	err = watcher.Add(tmpFile)
	if err != nil {
		panic(err)
	}
	for {
		select {
		case event := <-watcher.Events:
			if (event.Op & fsnotify.Write) == fsnotify.Write {
				buf, err := ioutil.ReadFile(tmpFile)
				if err != nil {
					panic(err)
				}
				update(db, string(buf))
				log.Println("database updated")
			}
		case err := <-watcher.Errors:
			panic(err)
		case <-ctx.Done():
			log.Println("cleaning up")
			ioutil.WriteFile(filepath.Join(gitDir, "notes.md"), generate(db, keys(db)), 0644)
			os.Rename(tmpFile, "tmp.bak")
			cmd := exec.Command("git", "add", ".")
			cmd.Dir = gitDir
			cmd.Run()
			cmd = exec.Command("git", "commit", "-m", time.Now().String())
			cmd.Dir = gitDir
			cmd.Run()
			log.Println("cleanup finished")
			return
		}
	}
}
