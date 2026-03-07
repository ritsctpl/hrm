'use client';

import LaptopIcon from '@mui/icons-material/Laptop';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import StorageIcon from '@mui/icons-material/Storage';
import UsbIcon from '@mui/icons-material/Usb';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';

interface AssetCategoryIconProps {
  categoryCode: string;
  size?: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LAPTOP: LaptopIcon,
  DESKTOP: StorageIcon,
  MOB: SmartphoneIcon,
  VEH: DirectionsCarIcon,
  HEAD: HeadphonesIcon,
  HDD: StorageIcon,
  PD: UsbIcon,
};

export default function AssetCategoryIcon({ categoryCode, size = 20 }: AssetCategoryIconProps) {
  const Icon = ICON_MAP[categoryCode.toUpperCase()] ?? DevicesOtherIcon;
  return <Icon style={{ fontSize: size, color: '#1890ff' }} />;
}
