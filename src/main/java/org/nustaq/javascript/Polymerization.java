package org.nustaq.javascript;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Comment;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.select.Elements;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.file.FileSystem;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Created by ruedi on 15/07/15.
 */
public class Polymerization {

    private static final int IN_COMMENT = 1;
    private static final int SCAN = 0;

    public void transformComponent(File htmlFile, String baseUrl, File outputDir) throws IOException {
        String compName = htmlFile.getName().substring(0, htmlFile.getName().length() - ".html".length());

        Document doc = Jsoup.parse(htmlFile, "UTF-8", baseUrl);
        List<Node> comments = new ArrayList<>();
        doc.getAllElements().forEach( elem -> {
            elem.childNodes().forEach( child -> {
                if ( child instanceof Comment ) {
                    comments.add(child);
                }
            });
        });

        comments.forEach( node -> node.remove() );

        // dom modules
        Elements domModules = doc.getElementsByTag("dom-module");
        domModules.forEach(dommod -> dommod.remove() );

        if ( domModules.size() > 0 ) {
            Element dom = domModules.first();
            String id = dom.attr("id");
            try {
                if ( ! compName.equals(id) ) {
                    System.err.println("component name does not match dom id compName:"+compName+" id:"+id);
                }
                writeDomAsComponent(outputDir, id, dom);
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            }
        }
        if ( domModules.size() > 1 ) {
            System.err.println("mulitple doms in "+htmlFile);
        }

        Elements scripts = doc.getElementsByTag("script");
        scripts.forEach(script -> script.remove());
        if ( scripts.size() > 0 ) {
            Element script = scripts.first();
            writeDomAsScript(outputDir, compName,script);
        }
        if ( scripts.size() > 1 ) {
            System.err.println("mulitple scripts in " + htmlFile);
        }

        Elements links = doc.getElementsByTag("link");
        links.forEach(li -> li.remove() );
        writeKson(outputDir, compName, links);


        Elements styles = doc.getElementsByTag("style");
        styles.forEach(li -> li.remove() );
        if ( styles.size() > 0 ) {
            Element style = styles.first();
            writeStyle(outputDir, compName, style);
        }
        if ( scripts.size() > 1 ) {
            System.err.println("mulitple styles in " + htmlFile);
        }

        // check for unprocessed content
        AtomicBoolean err = new AtomicBoolean(false);
        doc.getAllElements().forEach(elem -> {
            String tag = elem.tagName();
            if (!tag.equals("html") && !tag.equals("body") && !tag.equals("head") && !tag.equals("#root")) {
                System.err.println("unprocessed element " + elem.tagName());
                err.set(true);
            }
        });
        if ( err.get() ) {
            System.err.println("ERRORS PROCESSING "+htmlFile.getName());
        } else {
            System.out.println("SUCCESSFULLY TRANSFORMED "+htmlFile.getName());
        }
    }

    private void writeKson(File base, String compName, Elements links) throws FileNotFoundException {
        File componentDir = new File( base, compName );
        componentDir.mkdirs();
        PrintStream pout = new PrintStream( new File(componentDir,"dep.kson") );
        pout.println("{");
        pout.print("  depends: [ ");
        links.forEach(link -> {
            if (link.attr("rel").equals("import")) {
                String attr = link.attr("href");
                int idx = attr.lastIndexOf("/");
                if ( idx >= 0 ) {
                    attr = attr.substring(idx+1);
                }
                attr = attr.substring(0, attr.length() - ".html".length());
                pout.print(attr + " ");
            } else {
                System.err.println("import ignored " + link);
            }
        });
        pout.println("]");
        pout.print("}");
    }

    private void writeDomAsScript(File base, String compName, Element script) throws FileNotFoundException {
        File componentDir = new File( base, compName );
        componentDir.mkdirs();
        PrintStream pout = new PrintStream( new File(componentDir,compName+".js") );
        try {
            String scr = script.childNodes().get(0).toString();
            if ( script.childNodes().size() > 1 )
                System.err.println("unexpected number of childnodes in script "+compName);
            pout.print(scr);
            pout.close();
        } catch (Throwable th) {
            System.out.println("no script content"+script);
        }
    }

    private void writeDomAsComponent(File base, String compName, Element dom) throws FileNotFoundException {
        File componentDir = new File( base, compName );
        componentDir.mkdirs();
        PrintStream pout = new PrintStream( new File(componentDir,compName+".dom.html") );
        pout.print(dom);
        pout.close();
    }

    private void writeStyle(File base, String compName, Element dom) throws FileNotFoundException {
        File componentDir = new File( base, compName );
        componentDir.mkdirs();
        PrintStream pout = new PrintStream( new File(componentDir,compName+".style.html") );
        pout.print(dom);
        pout.close();
    }

    public void iterate(File polymerDir,File outputDir) throws IOException {
        FileSystem fs = FileSystems.getDefault();
        if ( outputDir.exists() )
            delete(outputDir);
        outputDir.mkdirs();
        HashSet<String> ignored = new HashSet<>();
        ignored.add( "bower.json"); ignored.add("hero.svg");
        ignored.add( ".bower.json"); ignored.add( ".gitignore");
        ignored.add("index.html");ignored.add( "README.md");ignored.add( "component.json");ignored.add( "package.json");
        ignored.add( "index.js");ignored.add("MAKEFILE");
        File[] files = polymerDir.listFiles();
        for (int i = 0; i < files.length; i++) {
            File file = files[i];
            if ( file.isDirectory() ) {
                String compName = file.getName();
                File[] compFiles = file.listFiles();
                for (int j = 0; j < compFiles.length; j++) {
                    File compFile = compFiles[j];
                    if ( ! compFile.isDirectory() ) {
                        String name = compFile.getName();
                        if ( ! ignored.contains(name) ) {
                            if ( name.endsWith(".html") ) {
                                try {
                                    transformComponent(compFile, "", outputDir);
                                } catch (Throwable e) {
                                    e.printStackTrace();
                                }
                            } else if (name.endsWith(".css") || name.equalsIgnoreCase("LICENSE") || name.equalsIgnoreCase("LICENSE.txt")) { // plain css resource FIXME: scan dom-modules for links to those and adapt url to lookup/
                                File out = new File(outputDir,compName);
                                out.mkdirs();
                                Files.copy(compFile.toPath(),new File(out,name).toPath());
                            } else {
                                System.err.println("ignored file resource "+compFile.getCanonicalPath());
                            }
                        }
                    }
                }
            }
        }
    }

    void delete(File f) throws IOException {
      if (f.isDirectory()) {
        for (File c : f.listFiles())
          delete(c);
      }
      if (!f.delete())
        throw new FileNotFoundException("Failed to delete file: " + f);
    }

    public static void main(String[] args) throws IOException {
        Polymerization shim = new Polymerization();
        File outputDir = new File("/home/ruedi/projects/polystrene/web/lib/polystyrene");
        shim.iterate(
            new File("/home/ruedi/projects/polystrene/bower_components"),
            outputDir
        );
    }

}
