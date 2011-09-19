class JSFLImportHandler(ImportHandler):

    lang = lang

    def setCorePath(self, compiler=None, extra=None):
        self.corePath = []

    def _findScannableFiles(self, (files, searchedDirs), dirname, names):
        if sys.platform.startswith("win"):
            cpath = dirname.lower()
        else:
            cpath = dirname
        if cpath in searchedDirs:
            while names:
                del names[0]
            return
        else:
            searchedDirs[cpath] = 1
        for i in range(len(names)-1, -1, -1): # backward so can del from list
            path = os.path.join(dirname, names[i])
            if os.path.isdir(path):
                pass
            elif os.path.splitext(names[i])[1] in (".jsfl",):
                #XXX The list of extensions should be settable on
                #    the ImportHandler and Komodo should set whatever is
                #    set in prefs.
                #XXX This check for files should probably include
                #    scripts, which might likely not have the
                #    extension: need to grow filetype-from-content smarts.
                files.append(path)

    def genScannableFiles(self, path=None, skipRareImports=False,
                          importableOnly=False):
        if path is None:
            path = self._getPath()
        searchedDirs = {}
        for dirname in path:
            if dirname == os.curdir:
                # Do NOT traverse the common '.' element of @INC. It is
                # environment-dependent so not useful for the typical call
                # of this method.
                continue
            files = []
            os.path.walk(dirname, self._findScannableFiles,
                         (files, searchedDirs))
            for file in files:
                yield file

    def find_importables_in_dir(self, dir):
        """See citadel.py::ImportHandler.find_importables_in_dir() for
        details.

        Importables for JavaScript look like this:
            {"foo.js":  ("foo.js", None, False),
             "somedir": (None,     None, True)}

        TODO: log the fs-stat'ing a la codeintel.db logging.
        """
        from os.path import join, isdir, splitext

        if dir == "<Unsaved>":
            #TODO: stop these getting in here.
            return {}

        #TODO: log the fs-stat'ing a la codeintel.db logging.
        try:
            names = os.listdir(dir)
        except OSError, ex:
            return {}
        dirs, nondirs = set(), set()
        for name in names:
            try:
                if isdir(join(dir, name)):
                    dirs.add(name)
                else:
                    nondirs.add(name)
            except UnicodeDecodeError:
                # Hit a filename that cannot be encoded in the default encoding.
                # Just skip it. (Bug 82268)
                pass

        importables = {}
        for name in nondirs:
            base, ext = splitext(name)
            if ext != ".jsfl":
                continue
            if base in dirs:
                importables[base] = (name, None, True)
                dirs.remove(base)
            else:
                importables[base] = (name, None, False)
        for name in dirs:
            importables[name] = (None, None, True)

        return importables