import {
    Avatar,
    Box,
    Button,
    chakra,
    Container,
    Flex,
    Heading,
    Input,
    Spacer,
    Text,
} from '@chakra-ui/react'
import { useAuthContext } from '@src/feature/auth/provider/AuthProvider'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { getDatabase, onChildAdded, push, ref } from '@firebase/database'
import { FirebaseError } from '@firebase/util'
import { AuthGuard } from '@src/feature/auth/component/AuthGuard/AuthGuard'
import { serverTimestamp } from '@firebase/database'

type MessageProps = {
    message: string
    uid: string
    imageUrl: string
    timestamp: Date | null
}

type Chat = {
    message: string
    uid: string
    profileImageUrl: string
    timestamp: Date | null
}

const Message = ({ message, uid, imageUrl, timestamp }: MessageProps) => {
    const { user } = useAuthContext()
    const isCurrentUser = user?.uid === uid
    const formattedDate = timestamp ? timestamp.toLocaleTimeString().slice(0, 5) : null
    return (
        <Flex
            alignItems={'center'}
            justifyContent={isCurrentUser ? 'flex-end' : 'flex-start'}
            mt={isCurrentUser ? 1 : 0}
            mb={isCurrentUser ? 1 : 0}
        >
            {isCurrentUser && (
                <Text fontSize="xs" mt={1}>
                    {formattedDate}
                </Text>
            )}
            {!isCurrentUser ? (<Avatar src={ imageUrl } />) : null}
            <Box ml={2}>
                <Text bgColor={'gray.200'} rounded={'md'} px={2} py={1}>
                    {message}
                </Text>
            </Box>
            {!isCurrentUser && (
                <Text fontSize="xs" mt={1} ml={2}>
                    {formattedDate}
                </Text>
            )}
        </Flex>
    )
}

export const Page = () => {
    const { user, myProfileImageUrl } = useAuthContext()
    const messagesElementRef = useRef<HTMLDivElement | null>(null)
    const [message, setMessage] = useState<string>('')
    const [chats, setChats] = useState<Chat[]>([])

    const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (!user) return
            const db = getDatabase()
            const dbRef = ref(db, 'chat')
            await push(dbRef, {
                message,
                uid: user.uid,
                profileImageUrl: myProfileImageUrl,
                timestamp: serverTimestamp()
            })
            setMessage('')
        } catch (e) {
            if (e instanceof FirebaseError) {
            console.log(e)
            }
        }
    }

    useEffect(() => {
        try {
            const db = getDatabase()
            const dbRef = ref(db, 'chat')
            return onChildAdded(dbRef, async (snapshot) => {
                const chatData: Chat = snapshot.val()
                const message = String(chatData['message'] ?? '')
                const uid = String(chatData['uid'] ?? '')
                const profileImageUrl = String((chatData['profileImageUrl'] ?? ''))
                const timestamp = chatData['timestamp'] ? new Date(chatData['timestamp']) : null

                setChats((prev) => [...prev, { message, uid, profileImageUrl: profileImageUrl, timestamp: timestamp }])
            })
        } catch (e) {
            if (e instanceof FirebaseError) {
                console.error(e)
            }

            return
        }
    }, [])

    useEffect(() => {
        messagesElementRef.current?.scrollTo({
            top: messagesElementRef.current.scrollHeight,
        })
    }, [chats])

    return (
        <AuthGuard>
            <Container
                py={2}
                flex={1}
                display={'flex'}
                flexDirection={'column'}
                minHeight={0}
            >
                <Heading>チャット</Heading>
                <Spacer flex={'none'} height={4} aria-hidden />
                <Flex
                    flexDirection={'column'}
                    overflowY={'auto'}
                    gap={2}
                    ref={messagesElementRef}
                >
                    {chats.map((chat, index) => (
                        <Message
                            message={chat.message}
                            key={`ChatMessage_${index}`}
                            uid={chat.uid}
                            imageUrl={chat.profileImageUrl}
                            timestamp={chat.timestamp}
                        />
                    ))}
                </Flex>
                <Spacer aria-hidden />
                <Spacer height={2} aria-hidden flex={'none'} />
                <chakra.form display={'flex'} gap={2} onSubmit={handleSendMessage}>
                    <Input value={message} onChange={(e) => setMessage(e.target.value)} />
                    <Button type={'submit'}>送信</Button>
                </chakra.form>
            </Container>
        </AuthGuard>
    )
}

export default Page