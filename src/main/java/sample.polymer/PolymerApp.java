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
 *
 * Example for a polymer kontraktor application
 *
 * This is the main server facade class. Once a client successfully authenticates
 * via login(), a session instance associated with the client is created.
 *
 */
public class PolymerApp extends Actor<PolymerApp> {

    Scheduler clientThreads[];
    String buzzWords;
    HashMap<PolymerUserSession,Callback> wordSubscriptions = new HashMap<>();
    AppConfig conf;

    @Local
    public void init(AppConfig conf) {
        this.conf = conf;
        buzzWords = conf.initialBuzz;
        clientThreads = new Scheduler[conf.sessionThreads];
        for (int i = 0; i < clientThreads.length; i++) {
            clientThreads[i] = new SimpleScheduler(conf.clientQSize,true);
        }
    }

    public IPromise<PolymerUserSession> login( String user, String pwd ) {
        Promise result = new Promise<>();
        if (wordSubscriptions.size() > conf.maxConnections) {
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
        Log.Info(this, "client closed " + session.getUserName().await());
        wordSubscriptions.remove(session);
    }

    public IPromise<Integer> getNumSessions() {
        return resolve(wordSubscriptions.size());
    }

    @Local
    public void subscribe(PolymerUserSession session, Callback<String> cb) {
        wordSubscriptions.put(session, cb);
        cb.stream(buzzWords);
    }

    void fireEvent() {
        wordSubscriptions.values().forEach(cb -> {
            try {
                cb.stream(buzzWords);
            } catch (Throwable th) {
                Log.Info(null, th);
            }
        });
    }

    @Local
    public void addText(String text) {
        if ( text == null || text.length() > 30 ) {
            return;
        }
        // some competitive replacing =) ..
        String lowered = text.toLowerCase();
        if ( lowered.indexOf("scala") >= 0 ) {
            text = lowered.replace("scala","Java");
        }
        if ( lowered.indexOf("akka") >= 0 ) {
            text = lowered.replace("akka","Kontraktor");
        }
        if ( lowered.indexOf("quasar") >= 0 ) {
            text = lowered.replace("quasar","Kontraktor");
        }
        while( buzzWords.length() > 1024 ) {
            int idx = buzzWords.indexOf(" ");
            if ( idx <= 0 ) {
                buzzWords = "";
            } else {
                buzzWords = buzzWords.substring(idx+1);
            }
        }
        buzzWords += " "+text;
        fireEvent();
    }

    public static void main(String[] args) throws IOException {
        File root = new File("./web");

        if ( ! new File(root,"index.html").exists() ) {
            System.out.println("Please run with working dir: '[projectroot]");
            System.exit(-1);
        }

        // create server actor + read config
        PolymerApp app = AsActor(PolymerApp.class);
        AppConfig conf = AppConfig.read();
        app.init(conf);

        Http4K.Build(conf.hostName, conf.port)
            .resourcePath(conf.urlRoot)
                .elements( conf.resources )
                .allDev( conf.devMode )
//                .cacheAggregates(false) // uncomment to debug aggregated but prod mode
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
