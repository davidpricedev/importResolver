# importResolver
The goal of this project is to allow you to freely reorganize your code without worrying about the relative paths in all your import/require statments

This utility will examine all your import/require statements, identifying which are broken.
It will attempt to fix any broken paths by using the algorithm specified in the configuration file.

Recommended Reorganization Steps: 

1. Reorganize your entire folder structure in a way that makes sense - including folder renaming (but don't rename files here)
1. Commit.
1. Run this tool to fix all the broken references. It will print out any that it was confused about so you know which ones to manually check/fix.
1. Commit.
1. Rename any files as needed - using your editors search & replace features to fix any require/import statements
1. Commit.
1. Celebrate

## Installation

`npm install import-resolver`

## Run 

`node importResolver [--dryRun] [<customConfigFile>]`

## Configuration

You will want a configuration file to customize the behaviour. 
It will look for the default configuration file of `importResolver.json`. 
You can also specify one on the command line: `node importResolver customConfigFile.json`.
If no config file is found or specified, defaults will be used.

Default Configuration: 

```javascript
{
    fileTypes: [ ".js", ".jsx" ],
    missingExtensions: [ ".js", ".jsx" ],
    exclude: [ ".git", "node_modules", "coverage" ],
    requireGitClean: false,
    resolveAlgo: "first",
}
```

* **fileTypes**: file types to examine
* **missingExtensions**: file extensions that are omitted from require/import statements
* **exclude**: folders to exclude/ignore
* **requireGitClean**: require git status to be clean before making changes
* **resolveAlgo**: an algorithm to use for resolving cases where a file requires/imports '../a/b/index'
  and there are 2+ index.js files in the tree. This is the algorithm used to pick the right one.
  One of: 
    * **first**: picks the first
    * **random**: picks one at random
    * **closest**: picks the closest - fewest directory traversals (up or down)
    * **rightPath**: picks the one whose rightmost (deepest) path elements are closest to the files rightmost path elements
    * **minDistance**: uses an edit-distance algorithm
