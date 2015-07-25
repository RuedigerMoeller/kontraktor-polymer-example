package sample.polymer;

import org.nustaq.kontraktor.Actor;
import org.nustaq.kontraktor.Callback;
import org.nustaq.kontraktor.IPromise;
import org.nustaq.kontraktor.remoting.base.RemotedActor;

/**
 * Created by ruedi on 13/07/15.
 *
 * Instances of this actor are created upon successful authentication per client
 *
 */
public class PolymerUserSession extends Actor<PolymerUserSession> implements RemotedActor {

    private PolymerApp app;
    private String user;

    @Override
    public void hasBeenUnpublished() {
        app.clientClosed(self());
    }

    public void init(PolymerApp self, String user) {
        this.app = self;
        this.user = user;
    }

    public IPromise<String> getUserName() {
        return resolve(user);
    }

    public void addText( String text ) {
        app.addText(text);
    }

    public void subscribe( Callback<String> cb ) {
        app.subscribe(self(),cb);
    }

}
