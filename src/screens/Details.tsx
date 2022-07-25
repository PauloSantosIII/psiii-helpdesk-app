import { useState, useEffect } from 'react'
import firestore from '@react-native-firebase/firestore'
import { VStack, Text, useTheme, HStack, ScrollView } from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../components/Header'
import { OrderProps } from '../components/Order'
import { Loading } from '../components/Loading'
import { CardDetails } from '../components/CardDetails'
import { OrderFirestoreDTO } from '../DTOs/OrderDTO'
import { dateFormat } from '../utils/firestoreDateFormat'
import { CircleWavyCheck, ClipboardText, DesktopTower, Hourglass } from 'phosphor-react-native'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Alert } from 'react-native'

type RouteParams = {
  orderId: string;
}

type OrderDetails = OrderProps & {
  description: string
  solution: string
  closed: string
}

export const Details = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails)
  const [solution, setSolution] = useState('')
  const navigation = useNavigation()
  const route = useRoute()
  const { orderId } = route.params as RouteParams
  const { colors } = useTheme()

  const handleClodeOrder = () => {
    if (!solution)
      return Alert.alert('Solicitação', 'Informar a solução para encerrar a solicitação.')

    firestore()
    .collection<OrderFirestoreDTO>('orders')
    .doc(orderId)
    .update({
      status: 'closed',
      solution,
      closed_at: firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      Alert.alert('Solicitação', 'Solicitação encerrada com sucesso.')
      navigation.goBack()
    })
    .catch((error) => {
      console.log(error)
      Alert.alert('Solicitação', 'Não foi possível encerrar a solicitação.')
    })
  }

  useEffect(() => {
    firestore()
    .collection<OrderFirestoreDTO>('orders')
    .doc(orderId)
    .get()
    .then((doc) => {
      const {
        patrimony, description, status, created_at, closed_at, solution 
      } = doc.data()

      const closed = closed_at ? dateFormat(closed_at) : null

      setOrder({
        id: doc.id,
        patrimony,
        description,
        status,
        solution,
        when: dateFormat(created_at),
        closed
      })
      setIsLoading(false)
    })
  }, [])

  if (isLoading)
    return <Loading />

  return (
    <VStack flex={1} bg="gray.700">
      <Header title="Solicitação" />
      
      <HStack bg='gray.500' justifyContent='center' p={4}>
        {
          order.status === 'closed'
          ? <CircleWavyCheck size={22} color={colors.green[300]} />
          : <Hourglass size={22} color={colors.secondary[700]} />
        }
        <Text
          fontSize='sm'
          color={order.status === 'closed' ? colors.green[300] : colors.secondary[700]}
          ml={2}
          textTransform='uppercase'
        >
          {order.status === 'closed' ? 'finalizado' : 'em andamento'}
        </Text>

        <ScrollView mx={5} showsVerticalScrollIndicator={false}>
          <CardDetails
            title='EQUIPAMENTO'
            description={`Patrimônio ${order.patrimony}`}
            icon={DesktopTower}
          />

          <CardDetails
            title='DESCRIÇÃO DO PROBLEMA'
            description={order.description}
            icon={ClipboardText}
            footer={`Registrado em ${order.when}`}
          />

          <CardDetails
            title='SOLUÇÃO'
            description={order.solution}
            icon={CircleWavyCheck}
            footer={order.closed && `Encerrado em ${order.closed}`}
          >
            {
              order.status === 'open' &&
              <Input
                placeholder='Descrição da solução'
                onChangeText={setSolution}
                textAlignVertical='top'
                multiline
                h={24}
              />
            }
          </CardDetails>
        </ScrollView>

        {
          order.status === 'open' &&
          <Button 
            title='Encerrar solicitação'
            m={5}
            onPress={handleClodeOrder}
          />
        }
      </HStack>
    </VStack>
  )
}