package org.tagsys.tagscreen;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.eclipse.jetty.websocket.api.*;
import org.eclipse.jetty.websocket.api.annotations.*;

@WebSocket
public class WebSocketHandler {

	private static List<Session> sessions = new ArrayList<Session>();

	private int numberUsers;
	
    @OnWebSocketConnect
    public void onConnect(Session session) throws Exception {
    	sessions.add(session);
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        sessions.remove(session);
    }

    @OnWebSocketMessage
    public void onMessage(Session session, String message) {
    		
    	System.out.println(message);
    
    }
    
    public void broadcast(String message){
    	
    	sessions.stream().filter(Session::isOpen).forEach(session->{
    		try {
				
    			session.getRemote().sendString(message);
    			
			} catch (Exception e) {
				e.printStackTrace();
			}
    		
    	});
    	
    }
   
    

}