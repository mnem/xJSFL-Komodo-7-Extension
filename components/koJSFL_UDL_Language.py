# Komodo JSFL language service.

from os.path import abspath, dirname, join
import sys
import logging
import komodo

log = logging.getLogger("koJSFLLanguage")
#log.setLevel(logging.DEBUG)

def registerLanguage(registry):
    log.debug("Registering language JSFL")
    registry.registerLanguage(KoJSFLLanguage())

# Hack start: add Komodo components directory to the sys.path, so we can import
#             and then inherit from koJavaScriptLanguage.

comppath = join(dirname(dirname(dirname(abspath(komodo.__file__)))), "components")
sys.path.append(comppath)
from koJavaScriptLanguage import koJavaScriptLanguage
sys.path.pop() # remove comppath
# Hack end:

class KoJSFLLanguage(koJavaScriptLanguage):
    name = "JSFL"
    _reg_desc_ = "%s Language" % name
    _reg_contractid_ = "@activestate.com/koLanguage?language=%s;1" % name
    _reg_clsid_ = "d7088ba0-909a-40e9-9d01-b90b12abd73c"
    _reg_categories_ = [("komodo-language", name)]
    defaultExtension = '.jsfl'

    # Hack start: make a Komodo langinfo entry.
    def __init__(self, *args, **kwargs):
        import langinfo
        langdb = langinfo.get_default_database()
        langdb._load_dir(join(dirname(dirname(abspath(__file__))), "pylib"))
        koJavaScriptLanguage.__init__(self, *args, **kwargs)
    # Hack end:

    # Hack start: add styling entries - to give it JS coloring.
        import styles
        styles.StateMap[self.name] = styles.StateMap['JavaScript'].copy()
    # Hack end:
