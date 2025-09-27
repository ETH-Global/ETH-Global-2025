import { Environment, Float, Sphere, OrbitControls } from "@react-three/drei"

export default function SignupScene() {
  return (
    <>
      <Environment preset="night" />
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#10b981" />

      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <Sphere args={[0.8, 32, 32]} position={[-3, 2, -2]}>
          <meshStandardMaterial color="#6366f1" transparent opacity={0.2} wireframe />
        </Sphere>
      </Float>

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.6}>
        <Sphere args={[0.4, 16, 16]} position={[3, -1, -1]}>
          <meshStandardMaterial color="#10b981" transparent opacity={0.3} emissive="#10b981" emissiveIntensity={0.1} />
        </Sphere>
      </Float>

      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.5}>
        <Sphere args={[0.6, 20, 20]} position={[0, 3, -3]}>
          <meshStandardMaterial
            color="#9333ea"
            transparent
            opacity={0.25}
            emissive="#9333ea"
            emissiveIntensity={0.15}
          />
        </Sphere>
      </Float>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </>
  )
}
