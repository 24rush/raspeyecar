from conio import getch
from threading import Thread, Condition, Event
import datetime
import time

def log(message):
    ts = datetime.datetime.fromtimestamp(time.time()).strftime('%H:%M:%S.%f')[:-3]
    print ts, message
        
class KeyProcessor():    
    FWD_RWD_TIMEOUT = 3;
    LET_RIGHT_TIMEOUT = 1;
    
    _commandPools = {'LR':{ 'duration':1, 'msgs':'LEFT;RIGHT;STOP'}, 'FB':{'duration':3, 'msgs':'FWD;BWD;STOP'}}
    _conditions = {}
    _events = {}
    _threads = {}
    _msgs = {}
    
    _msgToCmdPool= {}
    
    _cmdDurations = {}
    
    def __init__(self):
        for id in self._commandPools:
            cmdPool = self._commandPools[id]
            for msg in cmdPool['msgs'].split(';'):
                if msg not in self._msgToCmdPool:
                    self._msgToCmdPool[msg] = []
                    
                self._msgToCmdPool[msg].append(id)
                   
            self._conditions[id] = Condition()                    
            self._events[id] = Event()
            self._threads[id] = Thread(target=self.commandHandler, args=(id,))
            self._threads[id].start()
        
    def onSet(self, msg):    
        log ('SET ' + msg)
        
        if msg == 'STOP':
            return
        
        self._cmdDurations[msg] = time.time()
        
    def onUnSet(self, msg):
        log ('UNSET ' + msg)
        
        if msg == 'STOP':
            return
        
        log ('CMD ' + msg + ' set for ' + str(time.time() - self._cmdDurations[msg]))
        self._cmdDurations[msg] = None
        
    def commandHandler(self, id):
        while True:
            self._events[id].wait()                        
            self._conditions[id].acquire() 
            
            msg = (self._msgs[id] + 'X')[:-1]
            self._msgs[id] = ''
            #log ('Message ' + msg + ' received in pool ' + id)
                               
            self.onSet(msg)                   
            self._conditions[id].wait(self._commandPools[id]['duration'])
            
            self.onUnSet(msg)
            
            self._conditions[id].release();
            
            if self._msgs[id] == '':
                self._events[id].clear();            
      
    def processMessage(self, msg):
        pools = self._msgToCmdPool[msg] if msg in self._msgToCmdPool else []        
        #log( 'Message ' + msg + ' will be processed on pool(s) ' + str(pools))
        
        for pool in pools:            
            self._conditions[pool].acquire()
            self._msgs[pool] = msg
           
            self._conditions[pool].notify()
            self._conditions[pool].release()
            
            self._events[pool].set()                
                                       
       
def main():
    keyProc = KeyProcessor();
    
    keyProc.processMessage('BWD')
    time.sleep(0.4)
    keyProc.processMessage('FWD')
    #keyProc.processMessage('LEFT')
    time.sleep(2);
    keyProc.processMessage('BWD')
    time.sleep(1);
    keyProc.processMessage('BWD')
    keyProc.processMessage('LEFT')
    keyProc.processMessage('RIGHT')
    
    # key = getch()
    
    # while key != 'q':
    #    key = getch()   
    
if __name__ == '__main__':    
    main()
