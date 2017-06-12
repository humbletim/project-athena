//
//  Node.h
//  libraries/networking/src
//
//  Created by Stephen Birarda on 2/15/13.
//  Copyright 2013 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#ifndef hifi_Node_h
#define hifi_Node_h

#include <memory>
#include <ostream>
#include <stdint.h>

#include <QtCore/QDebug>
#include <QtCore/QMutex>
#include <QtCore/QSharedPointer>
#include <QtCore/QUuid>

#include <QReadLocker>
#include <UUIDHasher.h>

#include <TBBHelpers.h>

#include "HifiSockAddr.h"
#include "NetworkPeer.h"
#include "NodeData.h"
#include "NodeType.h"
#include "SimpleMovingAverage.h"
#include "MovingPercentile.h"
#include "NodePermissions.h"

class Node : public NetworkPeer {
    Q_OBJECT
public:
    Node(const QUuid& uuid, NodeType_t type,
         const HifiSockAddr& publicSocket, const HifiSockAddr& localSocket,
         const NodePermissions& permissions, bool isReplicated, const QUuid& connectionSecret = QUuid(),
         QObject* parent = nullptr);

    bool operator==(const Node& otherNode) const { return _uuid == otherNode._uuid; }
    bool operator!=(const Node& otherNode) const { return !(*this == otherNode); }

    char getType() const { return _type; }
    void setType(char type);

    bool isReplicated() const { return _isReplicated; }
    void setIsReplicated(bool isReplicated) { _isReplicated = isReplicated; }

    bool isUpstream() const { return _isUpstream; }
    void setIsUpstream(bool isUpstream) { _isUpstream = isUpstream; }

    const QUuid& getConnectionSecret() const { return _connectionSecret; }
    void setConnectionSecret(const QUuid& connectionSecret) { _connectionSecret = connectionSecret; }

    NodeData* getLinkedData() const { return _linkedData.get(); }
    void setLinkedData(std::unique_ptr<NodeData> linkedData) { _linkedData = std::move(linkedData); }

    int getPingMs() const { return _pingMs; }
    void setPingMs(int pingMs) { _pingMs = pingMs; }

    qint64 getClockSkewUsec() const { return _clockSkewUsec; }
    void updateClockSkewUsec(qint64 clockSkewSample);
    QMutex& getMutex() { return _mutex; }

    void setPermissions(const NodePermissions& newPermissions) { _permissions = newPermissions; }
    NodePermissions getPermissions() const { return _permissions; }
    bool isAllowedEditor() const { return _permissions.can(NodePermissions::Permission::canAdjustLocks); }
    bool getCanRez() const { return _permissions.can(NodePermissions::Permission::canRezPermanentEntities); }
    bool getCanRezTmp() const { return _permissions.can(NodePermissions::Permission::canRezTemporaryEntities); }
    bool getCanWriteToAssetServer() const { return _permissions.can(NodePermissions::Permission::canWriteToAssetServer); }
    bool getCanKick() const { return _permissions.can(NodePermissions::Permission::canKick); }

    void parseIgnoreRequestMessage(QSharedPointer<ReceivedMessage> message);
    void addIgnoredNode(const QUuid& otherNodeID);
    void removeIgnoredNode(const QUuid& otherNodeID);
    bool isIgnoringNodeWithID(const QUuid& nodeID) const { QReadLocker lock { &_ignoredNodeIDSetLock }; return _ignoredNodeIDSet.find(nodeID) != _ignoredNodeIDSet.cend(); }
    void parseIgnoreRadiusRequestMessage(QSharedPointer<ReceivedMessage> message);

    friend QDataStream& operator<<(QDataStream& out, const Node& node);
    friend QDataStream& operator>>(QDataStream& in, Node& node);

    bool isIgnoreRadiusEnabled() const { return _ignoreRadiusEnabled; }

    bool isMirror() const { return _isMirror; }
    void setIsMirror(bool isMirror) { _isMirror = isMirror; }

private:
    // privatize copy and assignment operator to disallow Node copying
    Node(const Node &otherNode);
    Node& operator=(Node otherNode);

    NodeType_t _type;

    QUuid _connectionSecret;
    std::unique_ptr<NodeData> _linkedData;
    bool _isReplicated { false };
    int _pingMs;
    qint64 _clockSkewUsec;
    QMutex _mutex;
    MovingPercentile _clockSkewMovingPercentile;
    NodePermissions _permissions;
    bool _isUpstream { false };
    tbb::concurrent_unordered_set<QUuid, UUIDHasher> _ignoredNodeIDSet;
    mutable QReadWriteLock _ignoredNodeIDSetLock;

    std::atomic_bool _ignoreRadiusEnabled;

    bool _isMirror { false };
};

Q_DECLARE_METATYPE(Node*)

typedef QSharedPointer<Node> SharedNodePointer;
Q_DECLARE_METATYPE(SharedNodePointer)

namespace std {
    template<>
    struct hash<SharedNodePointer> {
        size_t operator()(const SharedNodePointer& p) const {
            // Return the hash of the pointer
            return hash<Node*>()(p.data());
        }
    };
}

QDebug operator<<(QDebug debug, const Node& node);

#endif // hifi_Node_h
