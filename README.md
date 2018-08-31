BaPuLi
======

> Backup Purging List,


Índex
-----

<!-- vim-markdown-toc GitLab -->

* [Abstract](#abstract)
* [Compilation](#compilation)
* [Usage example](#usage-example)
* [Contributing](#contributing)

<!-- vim-markdown-toc -->


Abstract
--------

Take a list of backup files from stdin and generate a list of those which
can be removed according to given rules.

Each argument represents a rule of two time intervals separated by a colon. We
will call them *age* and *frequency*, respectively:

  * **Age:** Represents the minimum age of a file (how much time ago) for the
    rule starting to apply.

  * **Frequency:** Is the maximum allowed interval between two consecutive
    *preserved* (that is: omitted in the output) backups.

Below rules apply too:

  * Oldest file is always kept.

  * All rules apply from the *ending date* of the next rule to its own. Except
    last one which apply from the oldest file's date.

  * After the first rule's age, all files are kept.

  * Both intervals sould consist of a number and an unit name (ex: "1year")
    with no spaces.
    - If number is omitted, then `1` is assumed.
    - If unit is ommitted, then `day` is assumed.
    - Valid units are below (and in fact any of [MomentJS
      Duration](https://momentjs.com/docs/#/durations/creating/) units will
      work):


| Key            | Shorthand |
|----------------|-----------|
| year(s)        | y         |
| month(s)       | M         |
| week(s)        | w         |
| day(s)         | d         |
| hour(s)        | h         |
| minute(s)      | m         |
| second(s)      | s         |
| millisecond(s) | ms        |


File list is read from stdin (one file per row) and it is returned the same way
through stdout with kept files being removed so it can be used as input for a
deletion process.

All file name is supposed to contain a 'YYYYMMDD'-formatted date in its name
(first matching pattern will be assumed).


Compilation
-----------

```sh
npm run build
```

> You will find binary compiled for your OS under `build` directory.


Usage example
-------------

```
    ls | bapuli 1:1 1week:week 3month:1month 1year:1year 5year:10year
```

This will generate a list of files in the current directory (`ls`) that can be
removed ensuring to keep:


  * All files before 1 day


Contributing
------------

If you are interested in contributing with this project, you can do it in many ways:

  * Creating and/or mantainig documentation.

  * Implementing new features or improving code implementation.

  * Reporting bugs and/or fixing it.
  
  * Sending me any other feedback.

  * Whatever you like...
    
Please, contact-me, open issues or send pull-requests thought [this project GIT repository](https://github.com/bitifet/bapuli)

