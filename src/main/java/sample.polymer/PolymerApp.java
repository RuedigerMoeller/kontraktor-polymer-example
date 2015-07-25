package sample.polymer;

import org.nustaq.kontraktor.*;
import org.nustaq.kontraktor.annotations.Local;
import org.nustaq.kontraktor.impl.SimpleScheduler;
import org.nustaq.kontraktor.remoting.encoding.SerializerType;
import org.nustaq.kontraktor.remoting.http.Http4K;
import org.nustaq.kontraktor.util.Log;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;

/**
 * Created by ruedi on 12/07/15.
 */
public class PolymerApp extends Actor<PolymerApp> {

    public static final int CLIENT_QSIZE = 1000;

    Scheduler clientThreads[] = {
        new SimpleScheduler(CLIENT_QSIZE,true) // only one session processor thread should be sufficient for most apps.
    };

    String buzzWords = "Kontraktor WebComponents Polymer Undertow";
    HashMap<PolymerUserSession,Callback> wordSubscriptions = new HashMap<>();

    public IPromise<PolymerUserSession> login( String user, String pwd ) {
        Promise result = new Promise<>();
        if (wordSubscriptions.size() > 10_000) {
            result.reject("Too many users. Try later.");
            closeCurrentClient();
        } else
        if ( "admin".equals(user) ) {
            // deny access for admin's
            result.reject("Access denied");
        } else {
            // create new session and assign it a random scheduler (~thread). Note that with async nonblocking style
            // one thread will be sufficient most of the time. For very computing intensive apps increase clientThreads to like 2-4
            PolymerUserSession sess = AsActor(PolymerUserSession.class,clientThreads[((int) (Math.random() * clientThreads.length))]);
            sess.setThrowExWhenBlocked(true);
            sess.init( self(), user );
            result.resolve(sess);
        }
        return result;
    }

    @Local
    public void clientClosed(PolymerUserSession session) {
        System.out.println("client closed "+session.getUserName().await());
        wordSubscriptions.remove(session);
    }

    @Local
    public void subscribe(PolymerUserSession session, Callback<String> cb) {
        wordSubscriptions.put(session, cb);
        cb.stream(buzzWords);
    }

    void fireEvent() {
        wordSubscriptions.values().forEach( cb -> {
            try {
                cb.stream(buzzWords);
            } catch (Throwable th) {
                Log.Info(null,th);
            }
        });
    }

    @Local
    public void addText(String text) {
        while( buzzWords.length() > 1024 ) {
            int idx = buzzWords.indexOf(" ");
            if ( idx <= 0 ) {
                buzzWords = "";
            } else {
                buzzWords = buzzWords.substring(idx);
            }
        }
        buzzWords += " "+text;
        fireEvent();
    }

    public static void main(String[] args) throws IOException {
        // just setup stuff manually here. Its easy to build an application specific
        // config using e.g. json or kson.
        File root = new File("./web");

        if ( ! new File(root,"index.html").exists() ) {
            System.out.println("Please run with working dir: '[..]/polystrene");
            System.exit(-1);
        }

        // create server actor
        PolymerApp app = AsActor(PolymerApp.class);

        boolean DEV = false;
        Http4K.Build("localhost", 8080)
            .resourcePath("/")
                .elements(
                     "./web",
                     "./bower_components/",
                     "../kontraktor/modules/kontraktor-http/src/main/javascript"
                )
                .allDev(DEV)
                .cacheAggregates(false) // to debug aggregated
                .build()
            .httpAPI("/api", app)
            .serType(SerializerType.JsonNoRef)
                .setSessionTimeout(30_000)
                .build()
            .websocket("ws", app)
                .serType(SerializerType.JsonNoRef)
                .build()
            .build();
    }

}
