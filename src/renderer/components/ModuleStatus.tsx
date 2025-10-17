import React, { useEffect, useState } from 'react';
import { Box, HStack, Text, Tooltip, Badge } from '@chakra-ui/react';
import { FaFile, FaNetworkWired, FaVideo, FaGamepad, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface ModuleStatusState {
  fileOperations: boolean | null;
  lanShare: boolean | null;
  streamProtocol: boolean | null;
  phaser: boolean | null;
  lanStats?: { sends: number; receives: number };
}

const ModuleStatus: React.FC = () => {
  const [status, setStatus] = useState<ModuleStatusState>({
    fileOperations: null,
    lanShare: null,
    streamProtocol: null,
    phaser: null,
  });

  useEffect(() => {
    // Check module availability
    const checkModules = async () => {
      try {
        const [fileOps, lanShare, streamProto] = await Promise.all([
          window.electron.modules.checkFileOperations(),
          window.electron.modules.checkLanShare(),
          window.electron.modules.checkStreamProtocol(),
        ]);

        const lanStats = lanShare ? await window.electron.modules.getLanStats() : undefined;

        // Check if Phaser is available
        let phaserAvailable = false;
        try {
          const Phaser = await import('phaser');
          phaserAvailable = !!Phaser;
        } catch {
          phaserAvailable = false;
        }

        setStatus({
          fileOperations: fileOps,
          lanShare,
          streamProtocol: streamProto,
          phaser: phaserAvailable,
          lanStats,
        });
      } catch (error) {
        console.error('Failed to check module status:', error);
      }
    };

    checkModules();

    // Refresh every 5 seconds
    const interval = setInterval(checkModules, 5000);

    return () => clearInterval(interval);
  }, []);

  const StatusIcon = ({ active }: { active: boolean | null }) => {
    if (active === null) return <Box w="12px" h="12px" borderRadius="full" bg="gray.400" />;
    return active ? (
      <FaCheckCircle color="#48BB78" size={12} />
    ) : (
      <FaTimesCircle color="#F56565" size={12} />
    );
  };

  const getStatusColor = (active: boolean | null): string => {
    if (active === null) return 'gray';
    return active ? 'green' : 'red';
  };

  const getStatusText = (active: boolean | null): string => {
    if (active === null) return 'checking...';
    return active ? 'active' : 'inactive';
  };

  return (
    <Box
      py={2}
      px={4}
      borderRadius="md"
      bg="rgba(0, 0, 0, 0.2)"
      backdropFilter="blur(10px)"
      border="1px solid rgba(255, 255, 255, 0.1)"
    >
      <HStack spacing={6} justify="center" fontSize="sm">
        <Tooltip label="File Operations Module - Provides file dialogs, read/write, and metadata utilities">
          <HStack spacing={2}>
            <FaFile size={14} />
            <Text fontWeight="medium">File Ops</Text>
            <StatusIcon active={status.fileOperations} />
          </HStack>
        </Tooltip>

        <Tooltip
          label={
            status.lanStats
              ? `LAN Share Module - P2P file transfer (Active: ${status.lanStats.sends} sends, ${status.lanStats.receives} receives)`
              : 'LAN Share Module - Peer-to-peer file sharing over local network'
          }
        >
          <HStack spacing={2}>
            <FaNetworkWired size={14} />
            <Text fontWeight="medium">LAN Share</Text>
            <StatusIcon active={status.lanShare} />
            {status.lanStats && (status.lanStats.sends > 0 || status.lanStats.receives > 0) && (
              <Badge colorScheme="blue" fontSize="xs" ml={1}>
                {status.lanStats.sends + status.lanStats.receives}
              </Badge>
            )}
          </HStack>
        </Tooltip>

        <Tooltip label="Custom Stream Protocol - filestream:// protocol for direct file access with range requests">
          <HStack spacing={2}>
            <FaVideo size={14} />
            <Text fontWeight="medium">Stream Protocol</Text>
            <StatusIcon active={status.streamProtocol} />
          </HStack>
        </Tooltip>

        <Tooltip label="Phaser 3 Game Engine - Fast HTML5 game framework with WebGL and Canvas rendering">
          <HStack spacing={2}>
            <FaGamepad size={14} />
            <Text fontWeight="medium">Phaser</Text>
            <StatusIcon active={status.phaser} />
          </HStack>
        </Tooltip>
      </HStack>
    </Box>
  );
};

export default ModuleStatus;
