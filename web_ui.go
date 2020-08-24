package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/boltdb/bolt"
	"github.com/gin-gonic/gin"
)

func bundle() {
	cmd := exec.Command("esbuild", "--bundle", "--sourcemap", "src/index.tsx", "--outfile=public/bundle.js")
	cmd.Dir = "ui"
	cmd.Run()
}
func serve(db *bolt.DB) {
	debug := flag.Bool("d", false, "enable debug mode")
	flag.CommandLine.Parse(os.Args[2:])
	r := gin.Default()
	r.GET("/", func(ctx *gin.Context) {
		ctx.Redirect(http.StatusPermanentRedirect, "/index")
	})
	if *debug {
		r.GET("/index/*filepath", func(ctx *gin.Context) {
			path := ctx.Param("filepath")
			if path == "/bundle.js" {
				bundle()
			}
			ctx.File(filepath.Join("ui/public", path))
		})
	} else {
		appdata, ok := os.LookupEnv("APPDATA")
		var uiDir string
		if ok {
			uiDir = filepath.Join(appdata, "notesman-go")
		} else {
			homeDir, _ := os.UserHomeDir()
			uiDir = filepath.Join(homeDir, "noteman-go")
		}
		r.Static("/index", uiDir)
	}
	api := r.Group("/api")
	setupAPI(db, api)
	r.Run("127.0.0.1:8080")
}
func setupAPI(db *bolt.DB, r *gin.RouterGroup) {
	r.GET("/keys", func(ctx *gin.Context) {
		keys := keys(db)
		keysInString := make([]string, len(keys))
		for i, key := range keys {
			keysInString[i] = string(key)
		}
		result, _ := json.Marshal(keysInString)
		ctx.Writer.Write(result)
	})
	done := make(chan struct{})
	cleanupDone := make(chan struct{})
	go func() {
		<-done
		cleanupDone <- struct{}{}
	}()
	go func() {
		signals := make(chan os.Signal)
		signal.Notify(signals, syscall.SIGINT)
		<-signals
		done <- struct{}{}
		<-cleanupDone
		os.Exit(0)
	}()
	r.POST("/generate", func(ctx *gin.Context) {
		done <- struct{}{}
		<-cleanupDone
		var keysInString []string
		err := ctx.BindJSON(&keysInString)
		if err != nil {
			panic(err)
		}
		fmt.Println(keysInString)
		keys := make([][]byte, len(keysInString))
		for i, key := range keysInString {
			keys[i] = []byte(key)
		}
		ioutil.WriteFile(tmpFile, generate(db, keys), 0600)
		go func() {
			watch(db, done)
			cleanupDone <- struct{}{}
		}()
		ctx.String(http.StatusOK, "ok")
	})
}
