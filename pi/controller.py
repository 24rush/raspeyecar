from __future__ import print_function
import time
#from pololu_drv8835_rpi import motors, MAX_SPEED

import sys
import os
import json

from conio import getch
from threading import Thread, Condition, Event
import datetime
import time

from eventprocessor import EventProcessor

# Add a logging handler so we can see the raw communication data
import logging
root = logging.getLogger()
root.setLevel(logging.INFO)
ch = logging.StreamHandler(sys.stdout)
root.addHandler(ch)

#SPEED_2V = MAX_SPEED / 3

def log(message):
    #ts = datetime.datetime.fromtimestamp(time.time()).strftime('%H:%M:%S.%f')[:-3]
    print (message)

class KeyProcessor():
    FWD_RWD_TIMEOUT = 3;
    LET_RIGHT_TIMEOUT = 1;

    _commandPools = {'LR':{ 'duration':1, 'msgs':'LEFT;RIGHT;STOP'}, 'FB':{'duration':1, 'msgs':'FWD;BWD;STOP'}}
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

        if msg == 'FWD':
            motors.motor1.setSpeed(SPEED_2V)
        elif msg == 'BWD':
            motors.motor1.setSpeed(-SPEED_2V)
        elif msg == 'LEFT':
            motors.motor2.setSpeed(SPEED_2V)
        elif msg == 'RIGHT':
            motors.motor2.setSpeed(-SPEED_2V)
        else:
            print ('Unkown message', msg)

        self._cmdDurations[msg] = time.time()

    def process_msg(msg):
        if msg == 'FWD':
            motors.motor1.setSpeed(SPEED_2V)
        elif msg == 'BWD':
            motors.motor1.setSpeed(-SPEED_2V)
        elif msg == 'LEFT':
            motors.motor2.setSpeed(SPEED_2V)
        elif msg == 'RIGHT':
            motors.motor2.setSpeed(-SPEED_2V)
        else:
            print ('Unkown message', msg)

    def onUnSet(self, msg):
        log ('UNSET ' + msg)

        if msg == 'STOP':
            motors.setSpeeds(0, 0)
            return

        if msg == 'FWD' or msg == 'BWD':
            motors.motor1.setSpeed(0)
        elif msg == 'LEFT' or msg == 'RIGHT':
            motors.motor2.setSpeed(0)
        else:
            print ('Unkown message', msg)

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
    eventQ = EventProcessor()

    keyProc = KeyProcessor()

    while True:
        mode = getch()
        print (mode)

        if mode == 'w':
           keyProc.processMessage('FWD')
        if mode == 'a':
           keyProc.processMessage('LEFT')
        if mode == 's':
           keyProc.processMessage('BWD')
        if mode == 'd':
           keyProc.processMessage('RIGHT')
        if mode == 'x':
            keyProc.processMessage('STOP')
        if mode == 'q':
            print('Exit')
            keyProc.processMessage('STOP')
            break

if __name__ == '__main__':
    main()
